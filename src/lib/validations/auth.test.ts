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

test("registerSchema requires shop fields, phone, tradeKind, and 8-char password", () => {
  const ok = registerSchema.safeParse({
    fullName: "Aren Yılmaz",
    shopName: "Öztürk Oto",
    cityDistrict: "Ankara / Ostim",
    phone: "05321234567",
    tradeKind: "tamir",
    email: "a@b.com",
    password: "12345678",
  });
  assert.equal(ok.success, true);

  const short = registerSchema.safeParse({
    fullName: "Aren",
    shopName: "Test",
    cityDistrict: "Ankara",
    phone: "05321234567",
    tradeKind: "kaporta",
    email: "a@b.com",
    password: "123",
  });
  assert.equal(short.success, false);

  const noPhone = registerSchema.safeParse({
    fullName: "Aren",
    shopName: "Test",
    cityDistrict: "Ankara",
    phone: "123",
    tradeKind: "tamir",
    email: "a@b.com",
    password: "12345678",
  });
  assert.equal(noPhone.success, false);

  const badTrade = registerSchema.safeParse({
    fullName: "Aren",
    shopName: "Test",
    cityDistrict: "Ankara",
    phone: "05321234567",
    tradeKind: "muhasebe",
    email: "a@b.com",
    password: "12345678",
  });
  assert.equal(badTrade.success, false);
});

test("oauthRegisterSchema does not require email or password", () => {
  const ok = oauthRegisterSchema.safeParse({
    fullName: "Aren Yılmaz",
    shopName: "Öztürk Oto",
    cityDistrict: "Ankara / Ostim",
    phone: "0532 123 45 67",
    tradeKind: "parca",
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
