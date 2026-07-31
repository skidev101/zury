import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

export class TokenCipher {
  private readonly key: Buffer;

  constructor(base64Key: string) {
    this.key = Buffer.from(base64Key, "base64");
    if (this.key.length !== 32) {
      throw new Error("Calendar token encryption key must contain 32 bytes");
    }
  }

  encrypt(value: string): string {
    const iv = randomBytes(12);
    const cipher = createCipheriv("aes-256-gcm", this.key, iv);
    const ciphertext = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
    return [iv, cipher.getAuthTag(), ciphertext].map((part) => part.toString("base64url")).join(".");
  }

  decrypt(value: string): string {
    const [iv, tag, ciphertext] = value.split(".").map((part) => Buffer.from(part ?? "", "base64url"));
    if (!iv || !tag || !ciphertext || iv.length !== 12 || tag.length !== 16) {
      throw new Error("Invalid encrypted calendar credential");
    }
    const decipher = createDecipheriv("aes-256-gcm", this.key, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
  }
}
