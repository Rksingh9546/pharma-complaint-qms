import { Field, ToggleField } from "./FormFields";
import FormSection from "./FormSection";

export default function Section4Assessment() {
  return (
    <FormSection number={4} title="Initial Assessment"
                 description="The AI proposes values — final assessment is yours.">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field name="severity" label="Initial Severity" type="select"
               options={["Minor", "Major", "Critical"]} />
        <Field name="priority" label="Priority" type="select"
               options={["Low", "Medium", "High", "Urgent"]} />
        <div className="grid gap-3 sm:col-span-2 sm:grid-cols-2">
          <ToggleField name="investigation_required" label="Investigation Required"
                       description="A formal QA investigation is needed for this complaint." />
          <ToggleField name="adverse_event" label="Adverse Event Suspected" danger
                       description="Any patient harm or adverse reaction reported or suspected." />
        </div>
      </div>
    </FormSection>
  );
}