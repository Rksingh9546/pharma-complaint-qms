import { Field } from "./FormFields";
import FormSection from "./FormSection";

const PRODUCT_TYPES = [
  { value: "API", label: "API — Active Pharmaceutical Ingredient" },
  { value: "FDF", label: "FDF — Finished Dosage Form" },
];

const UNITS = ["packs", "tablets", "capsules", "vials", "bottles",
               "cartons", "boxes", "kg", "grams", "liters", "units"];

export default function Section2Product() {
  return (
    <FormSection number={2} title="Product & Batch Identification"
                 description="Affected product, batch and traceability data.">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field name="product_name" label="Product Name" required />
        <Field name="product_type" label="Product Type" type="select" options={PRODUCT_TYPES} />
        <Field name="strength" label="Product Strength / Grade" />
        <Field name="batch_number" label="Batch / Lot Number"
               hint="As printed on the pack or CoA, e.g. PCM-260501" />
        <Field name="manufacturing_date" label="Manufacturing Date" type="date" />
        <Field name="expiry_date" label="Expiry Date" type="date" />
        <Field name="quantity_affected" label="Quantity Affected" type="number" min={0} />
        <Field name="unit" label="Unit" type="select" options={UNITS} />
      </div>
    </FormSection>
  );
}