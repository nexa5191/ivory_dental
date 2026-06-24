import { prisma } from "@/lib/prisma";

export const listProviders = () =>
  prisma.provider.findMany({
    where: {
      deactivatedAt: null,
    },
    orderBy: {
      name: "asc",
    },
  });

export const listAllProviders = () =>
  prisma.provider.findMany({
    orderBy: {
      name: "asc",
    },
  });

export const getProvider = (id: number) =>
  prisma.provider.findUnique({
    where: { id },
  });

export const createProvider = (data: {
  name: string;
  specialty: string;
  reg: string;
}) =>
  prisma.provider.create({
    data,
  });

export const updateProvider = (
  id: number,
  data: Partial<{
    name: string;
    specialty: string;
    reg: string;
  }>
) =>
  prisma.provider.update({
    where: { id },
    data,
  });

export const deactivateProvider = (id: number) =>
  prisma.provider.update({
    where: { id },
    data: {
      deactivatedAt: new Date(),
    },
  });

export const reactivateProvider = (id: number) =>
  prisma.provider.update({
    where: { id },
    data: {
      deactivatedAt: null,
    },
  });