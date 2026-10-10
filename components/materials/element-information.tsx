import {
  elementCategories,
  elementReferences,
} from "@/lib/materials/element-reference";

function ElectronConfiguration({ value }: { value: string | null }) {
  if (!value) return <>Not reported</>;
  return (
    <>
      {value.split(/(\d+[spdfg]\d+)/).map((part, index) => {
        const orbital = /^(\d+)([spdfg])(\d+)$/.exec(part);
        return orbital ? (
          <span key={index}>
            {orbital[1]}
            <i className="orbital-label">{orbital[2]}</i>
            <sup>{orbital[3]}</sup>
          </span>
        ) : (
          <span key={index}>{part}</span>
        );
      })}
    </>
  );
}
export function ElementInformation({
  symbol,
  variant = "panel",
}: {
  symbol: string;
  variant?: "panel" | "inset";
}) {
  const data = elementReferences[symbol];
  if (!data) return null;
  return (
    <div
      className={`element-information ${variant === "inset" ? "element-information-inset" : ""}`}
    >
      <div className="element-information-heading">
        <div className="element-identity-mark">
          <strong>{symbol}</strong>
          <small aria-label={`Atomic number ${data.atomicNumber}`}>
            Z {data.atomicNumber}
          </small>
        </div>
        <div className="element-identity-name">
          <b>{data.name}</b>
          <span>{elementCategories[data.category]}</span>
        </div>
      </div>
      <dl>
        {variant === "panel" && (
          <div>
            <dt>Atomic number</dt>
            <dd>{data.atomicNumber}</dd>
          </div>
        )}
        <div>
          <dt>Atomic mass (u)</dt>
          <dd>{data.atomicMass ?? "Not reported"}</dd>
        </div>
        <div>
          <dt>Electronegativity</dt>
          <dd>{data.electronegativity ?? "Not reported"}</dd>
        </div>
        <div className="configuration-row">
          <dt>Electron configuration</dt>
          <dd>
            <ElectronConfiguration value={data.electronConfiguration} />
          </dd>
        </div>
        <div>
          <dt>Oxidation states</dt>
          <dd>{data.oxidationStates ?? "Not reported"}</dd>
        </div>
      </dl>
      {variant === "panel" && (
        <p>PubChem reference values · source qualifiers retained.</p>
      )}
    </div>
  );
}
