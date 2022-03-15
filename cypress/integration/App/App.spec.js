/// <reference types="cypress" />
// cypress/integration/app.spec.js

// Welcome to Cypress!
//
// This spec file contains a variety of sample tests
// for a todo list app that are designed to demonstrate
// the power of writing tests in Cypress.
//
// To learn more about how Cypress works and
// what makes it such an awesome testing tool,
// please read our getting started guide:
// https://on.cypress.io/introduction-to-cypress
describe("App", () => {
  it("should get you to log in", () => {
    cy.visit("http://localhost:3000");
    cy.url().should("include", "login");
    cy.contains("Login to OurWorld")
      .parent()
      .find("input[type=password]")
      .should("exist");
  });
});
