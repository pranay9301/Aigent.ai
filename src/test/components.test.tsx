import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import React from "react";

// Mock firebase
vi.mock("../lib/firebase", () => ({
  db: {},
  auth: { currentUser: null },
  handleFirestoreError: vi.fn(() => new Error("mock")),
  OperationType: { LIST: "list", WRITE: "write" },
}));

// Mock firebase/firestore
vi.mock("firebase/firestore", () => ({
  collection: vi.fn(),
  getDocs: vi.fn(() => Promise.resolve({ docs: [] })),
  query: vi.fn(),
  limit: vi.fn(),
  where: vi.fn(),
  doc: vi.fn(),
  getDoc: vi.fn(() => Promise.resolve({ exists: () => false, data: () => ({}) })),
  updateDoc: vi.fn(),
  addDoc: vi.fn(),
  deleteDoc: vi.fn(),
  serverTimestamp: vi.fn(),
}));

// Mock motion
vi.mock("motion/react", () => ({
  motion: { div: (props: any) => React.createElement("div", props) },
}));

// Mock lucide-react
vi.mock("lucide-react", () => ({
  Users: () => null,
  Briefcase: () => null,
  CreditCard: () => null,
  ShieldAlert: () => null,
  BarChart3: () => null,
  Activity: () => null,
  Globe: () => null,
  MessageSquare: () => null,
  Search: () => null,
  Filter: () => null,
  MoreVertical: () => null,
  CheckCircle: () => null,
  XCircle: () => null,
}));

import AdminPanel from "../pages/AdminPanel";

describe("AdminPanel", () => {
  it("renders the admin heading", async () => {
    render(React.createElement(AdminPanel));
    await waitFor(() => expect(screen.getByText("GLOBAL ADMIN COMMAND")).toBeTruthy());
  });

  it("renders stats grid", async () => {
    render(React.createElement(AdminPanel));
    await waitFor(() => {
      expect(screen.getByText("Total Users")).toBeTruthy();
      expect(screen.getByText("Total Projects")).toBeTruthy();
      expect(screen.getByText("Admin Users")).toBeTruthy();
      expect(screen.getByText("Subscribed")).toBeTruthy();
    });
  });

  it("renders the user directory table", async () => {
    render(React.createElement(AdminPanel));
    await waitFor(() => {
      expect(screen.getByText("User Directory")).toBeTruthy();
      expect(screen.getByText("Identity")).toBeTruthy();
      expect(screen.getByText("Status")).toBeTruthy();
      expect(screen.getByText("Plan")).toBeTruthy();
    });
  });

  it("renders the audit logs button", async () => {
    render(React.createElement(AdminPanel));
    await waitFor(() => expect(screen.getByText("Full Audit Logs")).toBeTruthy());
  });

  it("shows empty state when no users", async () => {
    render(React.createElement(AdminPanel));
    await waitFor(() => expect(screen.getByText("No nodes detected in local sector.")).toBeTruthy());
  });
});
