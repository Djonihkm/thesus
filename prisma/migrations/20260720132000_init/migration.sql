-- CreateEnum
CREATE TYPE "Role" AS ENUM ('INSTITUTION', 'JURY', 'STUDENT');

-- CreateEnum
CREATE TYPE "MemoireStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "FileType" AS ENUM ('PDF', 'DOCX');

-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('QCU', 'VRAI_FAUX', 'TEXTE_TROU');

-- CreateEnum
CREATE TYPE "JuryQuestionCategory" AS ENUM ('METHODOLOGIE', 'RESULTATS', 'REVUE_LITTERATURE', 'PROBLEMATIQUE', 'PERSPECTIVES');

-- CreateTable
CREATE TABLE "Institution" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Institution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "institutionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Memoire" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileType" "FileType" NOT NULL,
    "status" "MemoireStatus" NOT NULL DEFAULT 'PENDING',
    "studentId" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Memoire_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditReport" (
    "id" TEXT NOT NULL,
    "memoireId" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "structureScore" DOUBLE PRECISION NOT NULL,
    "coherenceScore" DOUBLE PRECISION NOT NULL,
    "writingQualityScore" DOUBLE PRECISION NOT NULL,
    "recommendations" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlagiarismReport" (
    "id" TEXT NOT NULL,
    "memoireId" TEXT NOT NULL,
    "similarityScore" DOUBLE PRECISION NOT NULL,
    "matches" JSONB NOT NULL,
    "certificateUrl" TEXT,
    "qrCodeUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlagiarismReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quiz" (
    "id" TEXT NOT NULL,
    "memoireId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Quiz_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuizQuestion" (
    "id" TEXT NOT NULL,
    "quizId" TEXT NOT NULL,
    "type" "QuestionType" NOT NULL,
    "question" TEXT NOT NULL,
    "choices" JSONB,
    "correctAnswer" TEXT NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "QuizQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuizAttempt" (
    "id" TEXT NOT NULL,
    "quizId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "answers" JSONB NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuizAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JurySimulation" (
    "id" TEXT NOT NULL,
    "memoireId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JurySimulation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JuryQuestion" (
    "id" TEXT NOT NULL,
    "jurySimulationId" TEXT NOT NULL,
    "category" "JuryQuestionCategory" NOT NULL,
    "question" TEXT NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "JuryQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DefenseEvaluation" (
    "id" TEXT NOT NULL,
    "memoireId" TEXT NOT NULL,
    "juryId" TEXT NOT NULL,
    "grade" DOUBLE PRECISION NOT NULL,
    "criteria" JSONB NOT NULL,
    "comments" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DefenseEvaluation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Institution_slug_key" ON "Institution"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "AuditReport_memoireId_key" ON "AuditReport"("memoireId");

-- CreateIndex
CREATE UNIQUE INDEX "PlagiarismReport_memoireId_key" ON "PlagiarismReport"("memoireId");

-- CreateIndex
CREATE UNIQUE INDEX "Quiz_memoireId_key" ON "Quiz"("memoireId");

-- CreateIndex
CREATE UNIQUE INDEX "JurySimulation_memoireId_key" ON "JurySimulation"("memoireId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Memoire" ADD CONSTRAINT "Memoire_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Memoire" ADD CONSTRAINT "Memoire_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditReport" ADD CONSTRAINT "AuditReport_memoireId_fkey" FOREIGN KEY ("memoireId") REFERENCES "Memoire"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlagiarismReport" ADD CONSTRAINT "PlagiarismReport_memoireId_fkey" FOREIGN KEY ("memoireId") REFERENCES "Memoire"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quiz" ADD CONSTRAINT "Quiz_memoireId_fkey" FOREIGN KEY ("memoireId") REFERENCES "Memoire"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizQuestion" ADD CONSTRAINT "QuizQuestion_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "Quiz"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizAttempt" ADD CONSTRAINT "QuizAttempt_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "Quiz"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizAttempt" ADD CONSTRAINT "QuizAttempt_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JurySimulation" ADD CONSTRAINT "JurySimulation_memoireId_fkey" FOREIGN KEY ("memoireId") REFERENCES "Memoire"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JuryQuestion" ADD CONSTRAINT "JuryQuestion_jurySimulationId_fkey" FOREIGN KEY ("jurySimulationId") REFERENCES "JurySimulation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DefenseEvaluation" ADD CONSTRAINT "DefenseEvaluation_memoireId_fkey" FOREIGN KEY ("memoireId") REFERENCES "Memoire"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DefenseEvaluation" ADD CONSTRAINT "DefenseEvaluation_juryId_fkey" FOREIGN KEY ("juryId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
