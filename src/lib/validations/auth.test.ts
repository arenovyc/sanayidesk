import assert from "node:assert/strict";
import { test } from "node:test";
import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  oauthRegisterSchema,
  registerSchema,
  resetPasswordSchema,
} from "./auth";

test("loginSchema requires email and password", () => {
  assert.equal(
    loginSchema.safeParse({
      email: "a@b.com",
      password: "x",
      remember: true,
    }).success,
    true,
  );
  assert.equal(
    loginSchema.safeParse({
      email: "bad",
      password: "x",
      remember: false,
    }).success,
    false,
  );
});

test("registerSchema requires 8-char password and valid slug", () => {
  const ok = registerSchema.safeParse({
    fullName: "Aren",
    shopName: "Test Dükkan",
    slug: "test-dukkan",
    email: "a@b.com",
    password: "12345678",
  });
  assert.equal(ok.success, true);

  const short = registerSchema.safeParse({
    fullName: "Aren",
    shopName: "Test",
    slug: "test",
    email: "a@b.com",
    password: "123",
  });
  assert.equal(short.success, false);

  const badSlug = registerSchema.safeParse({
    fullName: "Aren",
    shopName: "Test",
    slug: "Bad Slug",
    email: "a@b.com",
    password: "12345678",
  });
  assert.equal(badSlug.success, false);
});

test("oauthRegisterSchema does not require email or password", () => {
  const ok = oauthRegisterSchema.safeParse({
    fullName: "Aren",
    shopName: "Test Dükkan",
    slug: "test-dukkan",
  });
  assert.equal(ok.success, true);
});

test("forgotPasswordSchema validates email", () => {
  assert.equal(
    forgotPasswordSchema.safeParse({ email: "a@b.com" }).success,
    true,
  );
  assert.equal(forgotPasswordSchema.safeParse({ email: "x" }).success, false);
});

test("resetPasswordSchema requires matching passwords", () => {
  assert.equal(
    resetPasswordSchema.safeParse({
      password: "12345678",
      confirmPassword: "12345678",
    }).success,
    true,
  );
  assert.equal(
    resetPasswordSchema.safeParse({
      password: "12345678",
      confirmPassword: "87654321",
    }).success,
    false,
  );
});

test("changePasswordSchema requires current and matching new passwords", () => {
  assert.equal(
    changePasswordSchema.safeParse({
      currentPassword: "oldpass12",
      password: "newpass12",
      confirmPassword: "newpass12",
    }).success,
    true,
  );
  assert.equal(
    changePasswordSchema.safeParse({
      currentPassword: "",
      password: "newpass12",
      confirmPassword: "newpass12",
    }).success,
    false,
  );
});
