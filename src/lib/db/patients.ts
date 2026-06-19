import { prisma } from "@/lib/prisma";
import { type Gender } from "../../app/generated/prisma/client";

type PatientInput = {
  name: string;
  dob: string;
  gender?: Gender;
  phone: string;
  email?: string;
  bloodGroup?: string;
  lastVisit?: string;
  anniversary?: string;
  abhaId?: string;
  gstin?: string;
  allergies?: string[];
  conditions?: string[];
  balance?: number;
};

export const listPatients = () =>
  prisma.patient.findMany({ orderBy: { name: "asc" } });

export const getPatient = (id: number) =>
  prisma.patient.findUnique({ where: { id } });

export const createPatient = (data: PatientInput) =>
  prisma.patient.create({
    data: {
      ...data,
      email: data.email ?? "",
      bloodGroup: data.bloodGroup ?? "",
      lastVisit: data.lastVisit ?? new Date().toISOString().slice(0, 10),
    },
  });

export const updatePatient = (id: number, data: Partial<PatientInput>) =>
  prisma.patient.update({ where: { id }, data });

export const deletePatient = (id: number) =>
  prisma.patient.delete({ where: { id } });
