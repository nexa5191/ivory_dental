import { HelpClient } from "@/components/help/help-client";
import { HELP_CATEGORIES, HELP_TASKS } from "@/lib/help";

export default function HelpPage() {
  return <HelpClient categories={HELP_CATEGORIES} tasks={HELP_TASKS} />;
}
