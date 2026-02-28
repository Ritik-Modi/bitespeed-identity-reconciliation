import { Contact, LinkPrecedence, Prisma, PrismaClient } from "@prisma/client";

export class ContactRepository {
  async findByEmailOrPhone(
    db: PrismaClient | Prisma.TransactionClient,
    email?: string,
    phoneNumber?: string
  ): Promise<Contact[]> {
    const filters: Prisma.ContactWhereInput[] = [];

    if (email) {
      filters.push({ email });
    }

    if (phoneNumber) {
      filters.push({ phoneNumber });
    }

    if (filters.length === 0) {
      return [];
    }

    return db.contact.findMany({
      where: {
        deletedAt: null,
        OR: filters
      },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }]
    });
  }

  async findClusterByPrimaryIds(
    db: PrismaClient | Prisma.TransactionClient,
    primaryIds: number[]
  ): Promise<Contact[]> {
    if (primaryIds.length === 0) {
      return [];
    }

    return db.contact.findMany({
      where: {
        deletedAt: null,
        OR: [{ id: { in: primaryIds } }, { linkedId: { in: primaryIds } }]
      },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }]
    });
  }

  async findClusterByPrimaryId(
    db: PrismaClient | Prisma.TransactionClient,
    primaryId: number
  ): Promise<Contact[]> {
    return db.contact.findMany({
      where: {
        deletedAt: null,
        OR: [{ id: primaryId }, { linkedId: primaryId }]
      },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }]
    });
  }

  async create(
    db: PrismaClient | Prisma.TransactionClient,
    data: {
      email?: string;
      phoneNumber?: string;
      linkedId?: number;
      linkPrecedence: LinkPrecedence;
    }
  ): Promise<Contact> {
    return db.contact.create({
      data: {
        email: data.email,
        phoneNumber: data.phoneNumber,
        linkedId: data.linkedId,
        linkPrecedence: data.linkPrecedence
      }
    });
  }

  async convertPrimaryToSecondary(
    db: PrismaClient | Prisma.TransactionClient,
    demotedPrimaryId: number,
    survivingPrimaryId: number
  ): Promise<void> {
    await db.contact.update({
      where: { id: demotedPrimaryId },
      data: {
        linkPrecedence: LinkPrecedence.secondary,
        linkedId: survivingPrimaryId
      }
    });
  }

  async reassignSecondaries(
    db: PrismaClient | Prisma.TransactionClient,
    fromPrimaryId: number,
    toPrimaryId: number
  ): Promise<void> {
    await db.contact.updateMany({
      where: {
        linkedId: fromPrimaryId,
        deletedAt: null,
        NOT: { id: fromPrimaryId }
      },
      data: { linkedId: toPrimaryId }
    });
  }
}
