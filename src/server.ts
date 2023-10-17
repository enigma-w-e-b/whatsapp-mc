import { PrismaClient } from "@prisma/client";
import whatsappHelper from "@/helpers/whatsapp-helper";
import { loadRepositories } from "@/database/repositories";

const prisma = new PrismaClient()

const repositories = loadRepositories(prisma)

void whatsappHelper.startAll(repositories)
