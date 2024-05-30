import { describe, test, beforeEach, afterEach, beforeAll, afterAll, expect } from '@jest/globals';
import { initializeTestEnvironment, RulesTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing';

const MY_PROJECT_ID = "webchat-tpi";
const myUserId = "user_abc";
const otherUserId = "user_xyz";
const myAuth = {uid: myUserId, email: "abc@gmail.com"};
const otherAuth = {uid: otherUserId, email: "xyz@gmail.com"}

beforeAll(async => {
    // initializeTestEnvironment()
})

beforeEach(async() => {
    // clear firestore
})

describe("Web Chat App", () => {
    test("Test Name", async() => {
        // await assertSucceeds() or assertFails()
    });
})

afterAll(async() => {
    // clear and delete all testing app
})