-- CreateTable
CREATE TABLE "accounts" (
    "id" SERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "accessToken" TEXT,
    "role" TEXT,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "whatsapps" (
    "id" SERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "session" TEXT NOT NULL,
    "remote_jid" TEXT NOT NULL,
    "owner_jid" TEXT NOT NULL,
    "account_uuid" INTEGER NOT NULL,
    "qrcode" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "whatsapps_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "accounts_id_key" ON "accounts"("id");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_uuid_key" ON "accounts"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_email_key" ON "accounts"("email");

-- CreateIndex
CREATE UNIQUE INDEX "whatsapps_uuid_key" ON "whatsapps"("uuid");

-- AddForeignKey
ALTER TABLE "whatsapps" ADD CONSTRAINT "whatsapps_account_uuid_fkey" FOREIGN KEY ("account_uuid") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
