-- CreateTable
CREATE TABLE "integration_probe" (
    "id" SERIAL NOT NULL,
    "marker" TEXT NOT NULL,

    CONSTRAINT "integration_probe_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "integration_probe_marker_key" ON "integration_probe"("marker");
