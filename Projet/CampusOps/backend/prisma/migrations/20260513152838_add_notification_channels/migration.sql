-- CreateEnum
CREATE TYPE "GradeType" AS ENUM ('Exam', 'TD', 'TP', 'Project');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('info', 'alert', 'reminder', 'success');

-- AlterTable
ALTER TABLE "notifications" ADD COLUMN     "audience" TEXT,
ADD COLUMN     "channels" TEXT[] DEFAULT ARRAY['inapp']::TEXT[],
ADD COLUMN     "email_sent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "group_id" TEXT,
ADD COLUMN     "sender_id" TEXT,
ADD COLUMN     "telegram_sent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "type" "NotificationType" NOT NULL DEFAULT 'info';

-- CreateTable
CREATE TABLE "grades" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "module_id" TEXT NOT NULL,
    "teacher_id" TEXT NOT NULL,
    "value" DECIMAL(4,2) NOT NULL,
    "grade_type" "GradeType" NOT NULL,
    "semester" TEXT NOT NULL DEFAULT 'S1-2024',
    "comment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "grades_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "grades_student_id_module_id_grade_type_semester_key" ON "grades"("student_id", "module_id", "grade_type", "semester");

-- AddForeignKey
ALTER TABLE "grades" ADD CONSTRAINT "grades_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grades" ADD CONSTRAINT "grades_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "modules"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grades" ADD CONSTRAINT "grades_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
