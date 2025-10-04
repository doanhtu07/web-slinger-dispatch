-- CreateEnum
CREATE TYPE "IncidentType" AS ENUM ('CRIME', 'ACCIDENT', 'FIRE', 'MEDICAL', 'OTHER');

-- CreateEnum
CREATE TYPE "IncidentStatus" AS ENUM ('ACTIVE', 'RESPONDING', 'RESOLVED');

-- CreateTable
CREATE TABLE "Incident" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "incident_type" "IncidentType" NOT NULL,
    "description" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "location_name" TEXT,
    "status" "IncidentStatus" NOT NULL DEFAULT 'ACTIVE',
    "reporter_name" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Incident_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Incident_user_id_idx" ON "Incident"("user_id");
