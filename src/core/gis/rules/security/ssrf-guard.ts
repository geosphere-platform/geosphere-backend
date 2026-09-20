/**
 * SSRFGuard — Server-Side Request Forgery Defense Service
 *
 * Validates outgoing webhook destination URLs against private networks, loopback addresses,
 * link-local addresses, and cloud metadata endpoints to prevent intranet SSRF attacks.
 */

import { InvalidWebhookUrlError } from "../../../errors/spatial-errors";

export class SSRFGuard {
  /**
   * Validate destination URL against SSRF rules.
   * Throws `InvalidWebhookUrlError` if URL is forbidden or unsafe.
   */
  public static validateUrl(urlStr: string): void {
    if (!urlStr || typeof urlStr !== "string" || urlStr.trim() === "") {
      throw new InvalidWebhookUrlError("Webhook URL cannot be empty");
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(urlStr);
    } catch {
      throw new InvalidWebhookUrlError(`Invalid URL format: '${urlStr}'`);
    }

    // Protocol check — only HTTP or HTTPS permitted
    if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
      throw new InvalidWebhookUrlError(
        `Forbidden protocol '${parsedUrl.protocol}'. Webhooks must use HTTP or HTTPS.`,
      );
    }

    const hostname = parsedUrl.hostname.toLowerCase();

    // Loopback hostnames check
    if (
      hostname === "localhost" ||
      hostname === "localhost.localdomain" ||
      hostname.endsWith(".localhost") ||
      hostname === "0.0.0.0" ||
      hostname === "::" ||
      hostname === "[::]"
    ) {
      throw new InvalidWebhookUrlError(
        `SSRF Blocked: Destination host '${hostname}' is restricted (loopback)`,
      );
    }

    // IP address checks
    if (SSRFGuard.isPrivateOrRestrictedIp(hostname)) {
      throw new InvalidWebhookUrlError(
        `SSRF Blocked: Destination IP '${hostname}' is restricted (private/local network)`,
      );
    }
  }

  /**
   * Check if a hostname string is a private or restricted IP address
   */
  private static isPrivateOrRestrictedIp(host: string): boolean {
    const cleanHost = host.replace(/^\[|\]$/g, ""); // Strip IPv6 brackets if any

    // Check standard IPv4 format
    const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
    const match = cleanHost.match(ipv4Regex);

    if (match) {
      const p1 = parseInt(match[1], 10);
      const p2 = parseInt(match[2], 10);

      // Loopback 127.0.0.0/8
      if (p1 === 127) return true;

      // 0.0.0.0/8
      if (p1 === 0) return true;

      // Private RFC 1918 10.0.0.0/8
      if (p1 === 10) return true;

      // Private RFC 1918 172.16.0.0/12 (172.16.0.0 - 172.31.255.255)
      if (p1 === 172 && p2 >= 16 && p2 <= 31) return true;

      // Private RFC 1918 192.168.0.0/16
      if (p1 === 192 && p2 === 168) return true;

      // Link-Local / Cloud Metadata RFC 3927 169.254.0.0/16 (e.g. 169.254.169.254)
      if (p1 === 169 && p2 === 254) return true;

      // Carrier-grade NAT RFC 6598 100.64.0.0/10
      if (p1 === 100 && p2 >= 64 && p2 <= 127) return true;

      // Multicast 224.0.0.0/4
      if (p1 >= 224 && p1 <= 239) return true;
    }

    // Check standard IPv6 format
    if (
      cleanHost === "::1" ||
      cleanHost.startsWith("fe80:") || // Link-local
      cleanHost.startsWith("fc00:") || // Unique local address
      cleanHost.startsWith("fd00:")
    ) {
      return true;
    }

    return false;
  }
}
