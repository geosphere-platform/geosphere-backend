import { InvitationService } from "../../core/tenant/invitation.service";
import assert from "assert";

export function runInvitationUnitTests() {
  console.log("   --> Testing Secure Token Hashing & Generation...");
  const rawToken1 = InvitationService.generateRawToken();
  const rawToken2 = InvitationService.generateRawToken();

  assert.notStrictEqual(rawToken1, rawToken2);
  assert.strictEqual(rawToken1.length, 64); // 32 random bytes in hex = 64 chars

  const hash1 = InvitationService.hashToken(rawToken1);
  const hash1Repeat = InvitationService.hashToken(rawToken1);
  const hash2 = InvitationService.hashToken(rawToken2);

  assert.strictEqual(hash1, hash1Repeat);
  assert.notStrictEqual(hash1, hash2);
  assert.notStrictEqual(hash1, rawToken1);

  console.log("   ✅ Invitation Unit Tests Passed.");
}

if (require.main === module) {
  runInvitationUnitTests();
}
