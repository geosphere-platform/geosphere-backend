import { commercialLicenseService } from "../../core/developer/commercial-license.service";

export function runDeveloperLicenseUnitTests() {
  console.log("Testing Commercial License Foundation Service...");

  const testOrgId = "00000000-0000-0000-0000-000000000001";
  let licenseKey: string;

  return (async () => {
    // 1. Issue License
    const license = await commercialLicenseService.createLicense({
      organizationId: testOrgId,
      productName: "GIS Web SDK Enterprise",
      maxSeats: 100,
    });

    if (!license.licenseKey.startsWith("LIC-GISWEBSDKENTERPRISE-")) {
      throw new Error("License key formatting invalid");
    }

    licenseKey = license.licenseKey;

    // 2. Verify License
    const verify = await commercialLicenseService.verifyLicense(licenseKey);
    if (!verify.isValid || verify.license?.maxSeats !== 100) {
      throw new Error("License verification failed");
    }

    // 3. Revoke License
    await commercialLicenseService.revokeLicense(licenseKey, testOrgId);
    const verifyRevoked =
      await commercialLicenseService.verifyLicense(licenseKey);
    if (verifyRevoked.isValid) {
      throw new Error("Revoked license verification falsely succeeded");
    }
  })();
}
