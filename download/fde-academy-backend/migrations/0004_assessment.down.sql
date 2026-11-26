DROP TABLE IF EXISTS attempt_answers;
DROP TABLE IF EXISTS quiz_attempts;
DROP TRIGGER IF EXISTS trg_question_options_single_correct ON question_options;
DROP FUNCTION IF EXISTS check_single_correct_option();
DROP TABLE IF EXISTS question_options;
DROP TABLE IF EXISTS questions;
DROP TABLE IF EXISTS quizzes;
DROP TYPE IF EXISTS attempt_status;
DROP TYPE IF EXISTS quiz_kind;
