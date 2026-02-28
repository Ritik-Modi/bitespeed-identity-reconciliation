import { Contact, LinkPrecedence } from "@prisma/client";
import { prisma } from "../prisma";
import { ContactRepository } from "../repositories/contact.repository";
import { IdentifyRequestBody, IdentifyResponse } from "../types/contact.types";
import { buildIdentifyResponse } from "../utils/consolidate.util";

export class IdentityService {
  private readonly contactRepository = new ContactRepository();

  async identify(input: IdentifyRequestBody): Promise<IdentifyResponse> {
    return prisma.$transaction(async (tx) => {
      const matches = await this.contactRepository.findByEmailOrPhone(
        tx,
        input.email,
        input.phoneNumber
      );

      if (matches.length === 0) {
        const newPrimary = await this.contactRepository.create(tx, {
          email: input.email,
          phoneNumber: input.phoneNumber,
          linkPrecedence: LinkPrecedence.primary
        });

        return buildIdentifyResponse([newPrimary]);
      }

      const initialPrimaryIds = collectPrimaryIds(matches);
      let cluster = await this.contactRepository.findClusterByPrimaryIds(tx, initialPrimaryIds);

      const primaries = cluster.filter(
        (contact) => contact.linkPrecedence === LinkPrecedence.primary
      );

      const canonicalPrimary = primaries.sort(sortByCreatedAtThenId)[0];

      if (!canonicalPrimary) {
        throw new Error("Matched cluster has no primary contact");
      }

      if (primaries.length > 1) {
        for (const primary of primaries) {
          if (primary.id === canonicalPrimary.id) {
            continue;
          }

          await this.contactRepository.convertPrimaryToSecondary(tx, primary.id, canonicalPrimary.id);
          await this.contactRepository.reassignSecondaries(tx, primary.id, canonicalPrimary.id);
        }

        cluster = await this.contactRepository.findClusterByPrimaryId(tx, canonicalPrimary.id);
      }

      const shouldCreateSecondary = shouldCreateNewSecondary(cluster, input.email, input.phoneNumber);

      if (shouldCreateSecondary) {
        await this.contactRepository.create(tx, {
          email: input.email,
          phoneNumber: input.phoneNumber,
          linkedId: canonicalPrimary.id,
          linkPrecedence: LinkPrecedence.secondary
        });

        cluster = await this.contactRepository.findClusterByPrimaryId(tx, canonicalPrimary.id);
      }

      return buildIdentifyResponse(cluster);
    });
  }
}

function collectPrimaryIds(contacts: Contact[]): number[] {
  const ids = new Set<number>();

  for (const contact of contacts) {
    if (contact.linkPrecedence === LinkPrecedence.primary) {
      ids.add(contact.id);
    } else if (contact.linkedId) {
      ids.add(contact.linkedId);
    }
  }

  return [...ids];
}

function shouldCreateNewSecondary(
  cluster: Contact[],
  email?: string,
  phoneNumber?: string
): boolean {
  const emailExists = email ? cluster.some((contact) => contact.email === email) : true;
  const phoneExists = phoneNumber
    ? cluster.some((contact) => contact.phoneNumber === phoneNumber)
    : true;

  return !emailExists || !phoneExists;
}

function sortByCreatedAtThenId(a: Contact, b: Contact): number {
  const createdAtDiff = a.createdAt.getTime() - b.createdAt.getTime();
  return createdAtDiff !== 0 ? createdAtDiff : a.id - b.id;
}
