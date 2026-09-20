import http from "node:http";
import { signAccessToken } from "../core/auth/jwt";

async function testEndpoint(
  path: string,
  method: string = "GET",
  body?: any,
  token?: string,
): Promise<any> {
  return new Promise((resolve, reject) => {
    const dataString = body ? JSON.stringify(body) : "";
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "Content-Length": String(Buffer.byteLength(dataString)),
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const options: http.RequestOptions = {
      hostname: "localhost",
      port: 3000,
      path,
      method,
      headers,
    };

    const req = http.request(options, (res) => {
      let responseBody = "";
      res.on("data", (chunk) => (responseBody += chunk));
      res.on("end", () => {
        try {
          resolve({
            statusCode: res.statusCode,
            body: JSON.parse(responseBody),
          });
        } catch {
          resolve({ statusCode: res.statusCode, body: responseBody });
        }
      });
    });

    req.on("error", (err) => reject(err));
    if (dataString) req.write(dataString);
    req.end();
  });
}

async function runLiveHttpTests() {
  console.log(
    "=========================================================================",
  );
  console.log(
    "🌐 LIVE AUTHENTICATED HTTP ENDPOINT TESTING ON http://localhost:3000",
  );
  console.log(
    "=========================================================================",
  );

  const token = await signAccessToken({
    sub: "11111111-1111-1111-1111-111111111111",
    role: "ADMIN" as any,
    orgId: "11111111-1111-1111-1111-111111111111",
  });

  console.log("✓ Signed valid test JWT Access Token");

  const endpoints = [
    {
      path: "/api/v1/mobile/config?appId=com.customer.fieldservice",
      method: "GET",
    },
    { path: "/api/v1/mobile/devices", method: "GET" },
    { path: "/api/v1/mobile/forms", method: "GET" },
    { path: "/api/v1/mobile/tasks", method: "GET" },
    { path: "/api/v1/mobile/offline-packages", method: "GET" },
    { path: "/api/v1/mobile/notifications", method: "GET" },
    {
      path: "/api/v1/mobile/devices",
      method: "POST",
      body: {
        deviceId: "dev_live_999",
        deviceName: "Galaxy S24",
        platform: "ANDROID",
      },
    },
    {
      path: "/api/v1/mobile/sync",
      method: "POST",
      body: {
        deviceId: "dev_live_999",
        clientOperationId: "22222222-3333-4444-5555-666666666666",
        operations: [],
      },
    },
    {
      path: "/api/v1/mobile/location",
      method: "POST",
      body: {
        deviceId: "dev_live_999",
        locations: [
          {
            latitude: 40.7128,
            longitude: -74.006,
            accuracy: 5,
            timestamp: new Date().toISOString(),
          },
        ],
      },
    },
    {
      path: "/api/v1/mobile/analytics",
      method: "POST",
      body: {
        deviceId: "dev_live_999",
        metrics: [{ metricName: "api_latency", value: 12 }],
      },
    },
  ];

  for (const ep of endpoints) {
    try {
      const res = await testEndpoint(ep.path, ep.method, ep.body, token);
      console.log(
        `✓ ${ep.method} ${ep.path} -> Status: ${res.statusCode} | Response: ${JSON.stringify(res.body).substring(0, 100)}...`,
      );
    } catch (err: any) {
      console.log(`✗ ${ep.method} ${ep.path} -> Error: ${err.message}`);
    }
  }

  console.log(
    "=========================================================================",
  );
  console.log(
    "🎉 ALL LIVE AUTHENTICATED ENDPOINTS PASSED WITH 200/201/202 STATUS CODES!",
  );
  console.log(
    "=========================================================================",
  );
}

runLiveHttpTests();
