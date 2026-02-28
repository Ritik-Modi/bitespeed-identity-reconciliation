import { Contact, LinkPrecedence } from "@prisma/client";
import { IdentifyResponse } from "../types/contact.types";

export function buildIdentifyResponse(contacts: Contact[]): IdentifyResponse {
  const sorted = [...contacts].sort((a, b) => {
    const createdAtDiff = a.createdAt.getTime() - b.createdAt.getTime();
    return createdAtDiff !== 0 ? createdAtDiff : a.id - b.id;
  });

  const primary = sorted.find((contact) => contact.linkPrecedence === LinkPrecedence.primary);

  if (!primary) {
    throw new Error("No primary contact found in cluster");
  }

  const emails = uniqueOrderedValues(
    [primary.email, ...sorted.map((contact) => contact.email)].filter(
      (value): value is string => Boolean(value)
    )
  );

  const phoneNumbers = uniqueOrderedValues(
    [primary.phoneNumber, ...sorted.map((contact) => contact.phoneNumber)].filter(
      (value): value is string => Boolean(value)
    )
  );

  const secondaryContactIds = sorted
    .filter((contact) => contact.id !== primary.id)
    .map((contact) => contact.id);

  return {
    contact: {
      primaryContactId: primary.id,
      emails,
      phoneNumbers,
      secondaryContactIds
    }
  };
}

function uniqueOrderedValues(values: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    if (!seen.has(value)) {
      seen.add(value);
      result.push(value);
    }
  }

  return result;
}
