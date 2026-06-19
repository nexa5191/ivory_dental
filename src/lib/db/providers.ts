import { prisma } from "@/lib/prisma";

export const listProviders = () =>
  prisma.provider.findMany({ orderBy: { name: "asc" } });

export const getProvider = (id: number) =>
  prisma.provider.findUnique({ where: { id } });

export const createProvider = (data: {
  name: string;
  specialty: string;
  reg: string;
}) => prisma.provider.create({ data }); // color: "" removable after schema migration

export const updateProvider = (
  id: number,
  data: Partial<{ name: string; specialty: string; reg: string }>
) => prisma.provider.update({ where: { id }, data });

export const deleteProvider = (id: number) =>
  prisma.provider.delete({ where: { id } });
