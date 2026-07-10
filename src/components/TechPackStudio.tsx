import React, { useState } from 'react';
import { Download, Cpu, Plus, Trash2, Check, RefreshCw, Layers } from 'lucide-react';
import { csrfFetch } from '../utils/security';
import { jsPDF } from 'jspdf';

interface TechPackStudioProps {
  currentPrompt: string;
  currentMaterial: string;
  currentPalette: string;
  currentImage: string | null;
}

interface PantoneCode {
  colorName: string;
  code: string;
  hex: string;
}

interface SizingRow {
  parameter: string;
  xs: string;
  s: string;
  m: string;
  l: string;
  xl: string;
  xxl: string;
}

interface TrimItem {
  item: string;
  spec: string;
  cost: string;
}

interface TechPackData {
  garmentName: string;
  pantoneColorCodes: PantoneCode[];
  measurements: SizingRow[];
  fabricComposition: string;
  constructionDetails: string[];
  trimList: TrimItem[];
  costEstimate: {
    fabricCost: string;
    trimCost: string;
    laborCost: string;
    totalManufacturingCost: string;
    suggestedRetailPrice: string;
  };
}

export function TechPackStudio({ currentPrompt, currentMaterial, currentPalette, currentImage }: TechPackStudioProps) {
  const [loading, setLoading] = useState(false);
  const [techPack, setTechPack] = useState<TechPackData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Editable state hooks
  const [garmentName, setGarmentName] = useState('');
  const [fabricComposition, setFabricComposition] = useState('');
  const [measurements, setMeasurements] = useState<SizingRow[]>([]);
  const [trimList, setTrimList] = useState<TrimItem[]>([]);
  const [constructionDetails, setConstructionDetails] = useState<string[]>([]);
  const [pantones, setPantones] = useState<PantoneCode[]>([]);
  
  // Cost estimates
  const [fabricCost, setFabricCost] = useState('');
  const [trimCost, setTrimCost] = useState('');
  const [laborCost, setLaborCost] = useState('');
  const [retailPrice, setRetailPrice] = useState('');

  const generateTechPack = async () => {
    if (!currentPrompt) {
      setError("Please generate or select a design prompt first in the Atelier Creator.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await csrfFetch('/api/generate-tech-pack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: currentPrompt,
          material: currentMaterial,
          palette: currentPalette
        })
      });

      if (!response.ok) {
        throw new Error("Unable to contact garment technologist assistant.");
      }

      const data: TechPackData = await response.json();
      setTechPack(data);

      // Initialize edit fields
      setGarmentName(data.garmentName);
      setFabricComposition(data.fabricComposition);
      setMeasurements(data.measurements);
      setTrimList(data.trimList);
      setConstructionDetails(data.constructionDetails);
      setPantones(data.pantoneColorCodes);
      
      setFabricCost(data.costEstimate.fabricCost);
      setTrimCost(data.costEstimate.trimCost);
      setLaborCost(data.costEstimate.laborCost);
      setRetailPrice(data.costEstimate.suggestedRetailPrice);
    } catch (err: any) {
      console.error(err);
      setError("AI technologist is busy. Loading dynamic local specifications.");
    } finally {
      setLoading(false);
    }
  };

  const addMeasurementRow = () => {
    const newRow: SizingRow = {
      parameter: "New Spec (e.g., Collar circumference)",
      xs: "36 cm", s: "37 cm", m: "38 cm", l: "39 cm", xl: "40 cm", xxl: "41 cm"
    };
    setMeasurements([...measurements, newRow]);
  };

  const removeMeasurementRow = (index: number) => {
    setMeasurements(measurements.filter((_, i) => i !== index));
  };

  const addTrimItem = () => {
    const newItem: TrimItem = { item: "New Trim", spec: "Specify trim grade & count", cost: "$1.00" };
    setTrimList([...trimList, newItem]);
  };

  const removeTrimItem = (index: number) => {
    setTrimList(trimList.filter((_, i) => i !== index));
  };

  const addConstructionStep = () => {
    setConstructionDetails([...constructionDetails, "New seam or finish specification"]);
  };

  const removeConstructionStep = (index: number) => {
    setConstructionDetails(constructionDetails.filter((_, i) => i !== index));
  };

  const addPantone = () => {
    setPantones([...pantones, { colorName: "New Hue", code: "PANTONE 18-0000 TCX", hex: "#888888" }]);
  };

  const removePantone = (index: number) => {
    setPantones(pantones.filter((_, i) => i !== index));
  };

  const calculateTotalCost = () => {
    const f = parseFloat(fabricCost.replace('$', '')) || 0;
    const t = parseFloat(trimCost.replace('$', '')) || 0;
    const l = parseFloat(laborCost.replace('$', '')) || 0;
    return `$${(f + t + l).toFixed(2)}`;
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    let y = 15;

    // Title & Brand Block
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("COUTURE AI - GARMENT SPECIFICATION", 15, y);
    y += 10;
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(120, 120, 120);
    doc.text(`Digital Tech Pack - Created at ${new Date().toLocaleDateString()}`, 15, y);
    doc.setTextColor(0, 0, 0);
    y += 15;

    // Garment Summary Header
    doc.setDrawColor(230, 230, 230);
    doc.setLineWidth(0.5);
    doc.line(15, y, 195, y);
    y += 8;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text(`Garment Name: ${garmentName}`, 15, y);
    y += 8;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Base Fabric Composition: ${fabricComposition}`, 15, y, { maxWidth: 175 });
    y += 15;

    // Pantone Section
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Colorway Strategy & Pantone Specifications", 15, y);
    y += 6;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    pantones.forEach((p, idx) => {
      doc.text(`${idx + 1}. Color: ${p.colorName} | Code: ${p.code} | HEX: ${p.hex}`, 20, y);
      y += 5;
    });
    y += 8;

    // Measurement Sizing Table
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Size Grading Chart (XS - XXL) in CM/Inches", 15, y);
    y += 6;

    // Sizing Table Header
    doc.setFillColor(245, 245, 245);
    doc.rect(15, y, 180, 7, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text("Measurement Parameter", 17, y + 5);
    doc.text("XS", 100, y + 5);
    doc.text("S", 115, y + 5);
    doc.text("M", 130, y + 5);
    doc.text("L", 145, y + 5);
    doc.text("XL", 160, y + 5);
    doc.text("XXL", 175, y + 5);
    y += 7;

    doc.setFont("helvetica", "normal");
    measurements.forEach((m, idx) => {
      if (idx % 2 === 1) {
        doc.setFillColor(250, 250, 250);
        doc.rect(15, y, 180, 6, "F");
      }
      doc.text(m.parameter, 17, y + 4, { maxWidth: 80 });
      doc.text(m.xs, 100, y + 4);
      doc.text(m.s, 115, y + 4);
      doc.text(m.m, 130, y + 4);
      doc.text(m.l, 145, y + 4);
      doc.text(m.xl, 160, y + 4);
      doc.text(m.xxl, 175, y + 4);
      y += 6;
    });
    y += 10;

    // Trim Specifications
    if (y > 230) { doc.addPage(); y = 15; }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Required Bill of Trims & Accoutrements", 15, y);
    y += 6;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    trimList.forEach((t, idx) => {
      doc.text(`${t.item}: ${t.spec} (${t.cost})`, 20, y, { maxWidth: 165 });
      y += 5.5;
    });
    y += 10;

    // Construction steps
    if (y > 230) { doc.addPage(); y = 15; }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Atelier Construction & Seaming Detail Guidelines", 15, y);
    y += 6;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    constructionDetails.forEach((d, idx) => {
      doc.text(`[Seam Finish ${idx + 1}] - ${d}`, 20, y, { maxWidth: 165 });
      y += 6;
    });
    y += 12;

    // Cost Breakdown
    if (y > 230) { doc.addPage(); y = 15; }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Cost Formulation Sheet", 15, y);
    y += 6;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.text(`1. Raw Material Fabric Target Cost: ${fabricCost}`, 18, y); y += 5;
    doc.text(`2. Cumulative Trim/Hardware Cost: ${trimCost}`, 18, y); y += 5;
    doc.text(`3. Dedicated Seamstress Labor Cost: ${laborCost}`, 18, y); y += 5;
    
    doc.setFont("helvetica", "bold");
    doc.text(`Calculated Manufacturing Unit Cost: ${calculateTotalCost()}`, 18, y); y += 5.5;
    doc.setTextColor(16, 185, 129); // Emerald Green
    doc.text(`Target E-Commerce Retail Price: ${retailPrice}`, 18, y);
    doc.setTextColor(0, 0, 0);

    // Save PDF
    doc.save(`${garmentName.replace(/\s+/g, '_')}_tech_pack.pdf`);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8 text-left max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-gray-100 pb-6 mb-8 gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
            <Cpu className="w-6 h-6 text-indigo-600" />
            AI Tech Pack Studio
          </h2>
          <p className="text-xs text-gray-500 mt-1 uppercase tracking-widest font-medium">Garment construction details & size grading generator</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={generateTechPack}
            disabled={loading}
            className="px-4 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md hover:shadow-lg disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            {techPack ? 'Re-Generate with AI' : 'Generate Tech Pack'}
          </button>

          {techPack && (
            <button
              onClick={exportPDF}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md hover:shadow-lg"
            >
              <Download className="w-4 h-4" />
              Export as PDF Document
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 px-4 py-3 rounded-xl text-xs mb-6 font-medium">
          {error}
        </div>
      )}

      {!techPack && !loading && (
        <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-2xl max-w-md mx-auto">
          <Layers className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="font-display font-semibold text-gray-700 text-sm mb-1">No Active Tech Spec</h3>
          <p className="text-xs text-gray-500 max-w-xs mx-auto leading-relaxed mb-6">
            Generate standard measurements, Pantone cards, and pricing models directly from your latest Design Studio sketch.
          </p>
          <button
            onClick={generateTechPack}
            className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold rounded-xl text-xs transition-colors"
          >
            Load Atelier Concept
          </button>
        </div>
      )}

      {loading && (
        <div className="text-center py-20">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold animate-pulse">Consulting technical designers...</p>
        </div>
      )}

      {techPack && !loading && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Spec Editor Form column */}
          <div className="lg:col-span-2 space-y-6">
            {/* General Description section */}
            <div className="bg-gray-50 p-5 rounded-xl border border-gray-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4">Garment Identity</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5 block">Garment Model Name</label>
                  <input
                    type="text"
                    value={garmentName}
                    onChange={(e) => setGarmentName(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-white border border-gray-200 rounded-lg outline-none focus:ring-1 focus:ring-gray-900 font-medium"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5 block">Detailed Material Blend Composition</label>
                  <textarea
                    rows={3}
                    value={fabricComposition}
                    onChange={(e) => setFabricComposition(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-white border border-gray-200 rounded-lg outline-none focus:ring-1 focus:ring-gray-900 font-medium leading-relaxed"
                  />
                </div>
              </div>
            </div>

            {/* Sizing and measurement grading sheet */}
            <div className="bg-gray-50 p-5 rounded-xl border border-gray-100">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Measurement Sizing Specs</h3>
                <button
                  onClick={addMeasurementRow}
                  className="p-1.5 bg-white border border-gray-200 hover:bg-gray-100 rounded-lg text-gray-700 hover:text-gray-900 transition-colors"
                  title="Add dimension"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-gray-200 text-[10px] uppercase font-bold tracking-wider text-gray-400">
                      <th className="py-2 pr-4">Dimension Parameter</th>
                      <th className="py-2 px-1 text-center">XS</th>
                      <th className="py-2 px-1 text-center">S</th>
                      <th className="py-2 px-1 text-center">M</th>
                      <th className="py-2 px-1 text-center">L</th>
                      <th className="py-2 px-1 text-center">XL</th>
                      <th className="py-2 px-1 text-center">XXL</th>
                      <th className="py-2 pl-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {measurements.map((row, idx) => (
                      <tr key={idx} className="border-b border-gray-200/50 hover:bg-gray-100/40">
                        <td className="py-2.5 pr-4">
                          <input
                            type="text"
                            value={row.parameter}
                            onChange={(e) => {
                              const parameter = e.target.value;
                              setMeasurements(prev => prev.map((item, i) => i === idx ? { ...item, parameter } : item));
                            }}
                            className="bg-transparent border-none text-xs font-medium focus:ring-1 focus:ring-gray-400 p-1 w-full rounded"
                          />
                        </td>
                        {['xs', 's', 'm', 'l', 'xl', 'xxl'].map(sz => (
                          <td key={sz} className="py-2.5 px-1 text-center w-14">
                            <input
                              type="text"
                              value={(row as any)[sz]}
                              onChange={(e) => {
                                const val = e.target.value;
                                setMeasurements(prev => prev.map((item, i) => i === idx ? { ...item, [sz]: val } : item));
                              }}
                              className="bg-transparent border-none text-xs text-center font-semibold focus:ring-1 focus:ring-gray-400 p-1 w-full rounded text-gray-800"
                            />
                          </td>
                        ))}
                        <td className="py-2.5 pl-4 text-center">
                          <button
                            onClick={() => removeMeasurementRow(idx)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 rounded transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Trims list */}
            <div className="bg-gray-50 p-5 rounded-xl border border-gray-100">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Hardware & Trims (BOM)</h3>
                <button
                  onClick={addTrimItem}
                  className="p-1.5 bg-white border border-gray-200 hover:bg-gray-100 rounded-lg text-gray-700 hover:text-gray-900 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-2">
                {trimList.map((t, idx) => (
                  <div key={idx} className="flex gap-3 items-center bg-white p-2 rounded-lg border border-gray-200">
                    <input
                      type="text"
                      value={t.item}
                      onChange={(e) => {
                        const item = e.target.value;
                        setTrimList(prev => prev.map((x, i) => i === idx ? { ...x, item } : x));
                      }}
                      placeholder="Trim name"
                      className="text-xs font-semibold w-1/3 bg-transparent border-none outline-none focus:ring-1 focus:ring-gray-300 p-1 rounded"
                    />
                    <input
                      type="text"
                      value={t.spec}
                      onChange={(e) => {
                        const spec = e.target.value;
                        setTrimList(prev => prev.map((x, i) => i === idx ? { ...x, spec } : x));
                      }}
                      placeholder="Specifications"
                      className="text-xs text-gray-500 w-1/2 bg-transparent border-none outline-none focus:ring-1 focus:ring-gray-300 p-1 rounded"
                    />
                    <input
                      type="text"
                      value={t.cost}
                      onChange={(e) => {
                        const cost = e.target.value;
                        setTrimList(prev => prev.map((x, i) => i === idx ? { ...x, cost } : x));
                      }}
                      placeholder="Cost"
                      className="text-xs text-right font-mono text-gray-800 w-16 bg-transparent border-none outline-none focus:ring-1 focus:ring-gray-300 p-1 rounded"
                    />
                    <button
                      onClick={() => removeTrimItem(idx)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right sidebar column: image thumbnail + construction detail + cost calculations */}
          <div className="space-y-6">
            {/* Design reference visualizer thumbnail */}
            {currentImage && (
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-center">
                <h3 className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-3 text-left">Atelier Visual Target</h3>
                <div className="aspect-[3/4] rounded-lg overflow-hidden border border-gray-200 shadow-sm max-w-[200px] mx-auto bg-white p-1">
                  <img src={currentImage} alt="Reference Sketch" className="w-full h-full object-cover rounded-md" />
                </div>
              </div>
            )}

            {/* Pantone colors cards */}
            <div className="bg-gray-50 p-5 rounded-xl border border-gray-100">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Pantone Guide</h3>
                <button
                  onClick={addPantone}
                  className="p-1 bg-white border border-gray-200 hover:bg-gray-100 rounded text-gray-700"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {pantones.map((p, idx) => (
                  <div key={idx} className="bg-white p-2.5 rounded-lg border border-gray-100 text-left shadow-xs flex flex-col justify-between group relative">
                    <div className="w-full h-10 rounded mb-2 shadow-inner border border-gray-200" style={{ backgroundColor: p.hex }} />
                    <input
                      type="text"
                      value={p.colorName}
                      onChange={(e) => {
                        const colorName = e.target.value;
                        setPantones(prev => prev.map((x, i) => i === idx ? { ...x, colorName } : x));
                      }}
                      className="text-[10px] font-bold tracking-tight text-gray-900 bg-transparent border-none p-0 focus:outline-none"
                    />
                    <input
                      type="text"
                      value={p.code}
                      onChange={(e) => {
                        const code = e.target.value;
                        setPantones(prev => prev.map((x, i) => i === idx ? { ...x, code } : x));
                      }}
                      className="text-[8px] text-gray-400 font-medium uppercase tracking-wider bg-transparent border-none p-0 focus:outline-none mt-0.5"
                    />
                    <input
                      type="text"
                      value={p.hex}
                      onChange={(e) => {
                        const hex = e.target.value;
                        setPantones(prev => prev.map((x, i) => i === idx ? { ...x, hex } : x));
                      }}
                      className="text-[8px] font-mono text-gray-400 bg-transparent border-none p-0 focus:outline-none mt-0.5"
                    />
                    <button
                      onClick={() => removePantone(idx)}
                      className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 bg-white shadow p-0.5 rounded transition-opacity"
                    >
                      <Trash2 className="w-2.5 h-2.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Construction guidelines list */}
            <div className="bg-gray-50 p-5 rounded-xl border border-gray-100">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Atelier Seam Finishes</h3>
                <button
                  onClick={addConstructionStep}
                  className="p-1 bg-white border border-gray-200 hover:bg-gray-100 rounded text-gray-700"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>

              <div className="space-y-2">
                {constructionDetails.map((detail, idx) => (
                  <div key={idx} className="flex gap-2 items-start group">
                    <span className="text-[10px] font-bold text-gray-300 mt-1">#{(idx+1)}</span>
                    <textarea
                      rows={2}
                      value={detail}
                      onChange={(e) => {
                        const val = e.target.value;
                        setConstructionDetails(prev => prev.map((x, i) => i === idx ? val : x));
                      }}
                      className="text-[10px] leading-relaxed flex-1 p-1 bg-white border border-gray-200 rounded outline-none focus:ring-1 focus:ring-gray-300 font-medium text-gray-700"
                    />
                    <button
                      onClick={() => removeConstructionStep(idx)}
                      className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 self-center"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Pricing Worksheet calculator */}
            <div className="bg-gray-950 text-white p-5 rounded-xl border border-gray-800">
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-4">Costing Worksheet</h3>
              
              <div className="space-y-3.5 text-xs">
                <div className="flex justify-between items-center border-b border-white/5 pb-2">
                  <span className="text-gray-400">Fabric Target Cost:</span>
                  <input
                    type="text"
                    value={fabricCost}
                    onChange={(e) => setFabricCost(e.target.value)}
                    className="w-16 text-right bg-transparent border-none text-white focus:ring-1 focus:ring-gray-600 font-mono p-0"
                  />
                </div>
                <div className="flex justify-between items-center border-b border-white/5 pb-2">
                  <span className="text-gray-400">Hardware & Trims:</span>
                  <input
                    type="text"
                    value={trimCost}
                    onChange={(e) => setTrimCost(e.target.value)}
                    className="w-16 text-right bg-transparent border-none text-white focus:ring-1 focus:ring-gray-600 font-mono p-0 animate-none"
                  />
                </div>
                <div className="flex justify-between items-center border-b border-white/5 pb-2">
                  <span className="text-gray-400">Atelier Labor:</span>
                  <input
                    type="text"
                    value={laborCost}
                    onChange={(e) => setLaborCost(e.target.value)}
                    className="w-16 text-right bg-transparent border-none text-white focus:ring-1 focus:ring-gray-600 font-mono p-0"
                  />
                </div>
                <div className="flex justify-between items-center border-b border-white/5 pb-2 font-semibold">
                  <span className="text-indigo-400">Total Unit Manufacturing:</span>
                  <span className="font-mono text-indigo-400">{calculateTotalCost()}</span>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-emerald-400 font-bold">Suggested Retail Price:</span>
                  <input
                    type="text"
                    value={retailPrice}
                    onChange={(e) => setRetailPrice(e.target.value)}
                    className="w-20 text-right bg-transparent border-none text-emerald-400 focus:ring-1 focus:ring-emerald-700 font-mono p-0 font-bold text-sm"
                  />
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
