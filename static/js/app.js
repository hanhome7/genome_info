const CHROMOSOME_LENGTHS = {
  1: 248956422,
  2: 242193529,
  3: 198295559,
  4: 190214555,
  5: 181538259,
  6: 170805979,
  7: 159345973,
  8: 145138636,
  9: 138394717,
  10: 133797422,
  11: 135086622,
  12: 133275309,
  13: 114364328,
  14: 107043718,
  15: 101991189,
  16: 90338345,
  17: 83257441,
  18: 80373285,
  19: 58617616,
  20: 64444167,
  21: 46709983,
  22: 50818468,
  X: 156040895,
  Y: 57227415,
  MT: 16569,
};

const diagramHeight = 560;
const diagramTop = 20;
const chromosomeWidth = 80;
const diagramCenterX = 200;

function formatNumber(num) {
  return new Intl.NumberFormat("ja-JP").format(num);
}

function normalizeChromosome(chr) {
  const cleaned = String(chr).replace(/^chr/, "").toUpperCase();
  if (cleaned === "23") return "X";
  if (cleaned === "24") return "Y";
  if (cleaned === "25" || cleaned === "MT") return "MT";
  return cleaned;
}

function getChromosomeLength(chr) {
  const key = normalizeChromosome(chr);
  return CHROMOSOME_LENGTHS[key] || null;
}

function drawChromosome(chr, start, end, geneSymbol) {
  const svgGroup = document.getElementById("chromosome-group");
  svgGroup.innerHTML = "";

  const length = getChromosomeLength(chr);
  if (!length) {
    svgGroup.innerHTML = `<text x="${diagramCenterX}" y="300" text-anchor="middle" font-size="16">染色体 ${chr} の長さデータがありません</text>`;
    return;
  }

  const mid = Math.round((start + end) / 2);
  const relative = Math.max(0, Math.min(1, mid / length));
  const markerY = diagramTop + relative * diagramHeight;

  const cy = diagramTop + diagramHeight / 2;
  const halfW = chromosomeWidth / 2;

  // Chromosome body: rounded rectangle with pinched centromere
  const d = `
    M ${diagramCenterX - halfW + 10} ${diagramTop}
    Q ${diagramCenterX - halfW} ${diagramTop} ${diagramCenterX - halfW} ${diagramTop + 10}
    L ${diagramCenterX - halfW} ${cy - 15}
    Q ${diagramCenterX - halfW + 6} ${cy} ${diagramCenterX - halfW + 10} ${cy + 5}
    L ${diagramCenterX - halfW + 10} ${diagramTop + diagramHeight - 10}
    Q ${diagramCenterX - halfW} ${diagramTop + diagramHeight} ${diagramCenterX - halfW + 10} ${diagramTop + diagramHeight}
    L ${diagramCenterX + halfW - 10} ${diagramTop + diagramHeight}
    Q ${diagramCenterX + halfW} ${diagramTop + diagramHeight} ${diagramCenterX + halfW} ${diagramTop + diagramHeight - 10}
    L ${diagramCenterX + halfW - 10} ${cy + 5}
    Q ${diagramCenterX + halfW - 6} ${cy} ${diagramCenterX + halfW} ${cy - 15}
    L ${diagramCenterX + halfW} ${diagramTop + 10}
    Q ${diagramCenterX + halfW} ${diagramTop} ${diagramCenterX + halfW - 10} ${diagramTop}
    Z
  `;

  const body = document.createElementNS("http://www.w3.org/2000/svg", "path");
  body.setAttribute("d", d);
  body.setAttribute("fill", "url(#chromosomeGradient)");
  body.setAttribute("stroke", "#2563eb");
  body.setAttribute("stroke-width", "2");
  svgGroup.appendChild(body);

  // Centromere line
  const centromere = document.createElementNS("http://www.w3.org/2000/svg", "line");
  centromere.setAttribute("x1", diagramCenterX - halfW - 4);
  centromere.setAttribute("y1", cy);
  centromere.setAttribute("x2", diagramCenterX + halfW + 4);
  centromere.setAttribute("y2", cy);
  centromere.setAttribute("stroke", "#1e40af");
  centromere.setAttribute("stroke-width", "3");
  svgGroup.appendChild(centromere);

  // Marker for gene position
  const marker = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  marker.setAttribute("cx", diagramCenterX);
  marker.setAttribute("cy", markerY);
  marker.setAttribute("r", "8");
  marker.setAttribute("class", "gene-marker");
  svgGroup.appendChild(marker);

  // Gene label
  const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
  label.setAttribute("x", diagramCenterX + halfW + 12);
  label.setAttribute("y", markerY + 4);
  label.setAttribute("class", "gene-label");
  label.textContent = geneSymbol;
  svgGroup.appendChild(label);

  // Scale labels
  const topLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
  topLabel.setAttribute("x", diagramCenterX - halfW - 10);
  topLabel.setAttribute("y", diagramTop + 5);
  topLabel.setAttribute("text-anchor", "end");
  topLabel.setAttribute("font-size", "12");
  topLabel.setAttribute("fill", "#6b7280");
  topLabel.textContent = "0 bp";
  svgGroup.appendChild(topLabel);

  const bottomLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
  bottomLabel.setAttribute("x", diagramCenterX - halfW - 10);
  bottomLabel.setAttribute("y", diagramTop + diagramHeight + 5);
  bottomLabel.setAttribute("text-anchor", "end");
  bottomLabel.setAttribute("font-size", "12");
  bottomLabel.setAttribute("fill", "#6b7280");
  bottomLabel.textContent = `${formatNumber(length)} bp`;
  svgGroup.appendChild(bottomLabel);

  const positionLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
  positionLabel.setAttribute("x", diagramCenterX + halfW + 12);
  positionLabel.setAttribute("y", markerY + 18);
  positionLabel.setAttribute("font-size", "11");
  positionLabel.setAttribute("fill", "#4b5563");
  positionLabel.textContent = `${formatNumber(mid)} bp`;
  svgGroup.appendChild(positionLabel);

  document.getElementById("diagram-caption").textContent =
    `染色体 ${chr}（全長 ${formatNumber(length)} bp）の ${formatNumber(mid)} bp 付近に ${geneSymbol} が位置しています`;
}

async function fetchGeneInfo(query) {
  const url = `https://mygene.info/v3/query?q=${encodeURIComponent(query)}&fields=symbol,name,genomic_pos,chromosome,taxid&species=human`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`APIエラー: ${response.status}`);
  }
  const data = await response.json();
  if (!data.hits || data.hits.length === 0) {
    throw new Error("該当する遺伝子が見つかりませんでした");
  }

  // Prefer human results with genomic_pos
  const hit = data.hits.find((h) => h.taxid === 9606 && h.genomic_pos) || data.hits.find((h) => h.genomic_pos) || data.hits[0];

  let pos = hit.genomic_pos;
  if (Array.isArray(pos)) {
    pos = pos.find((p) => p.chr && !p.chr.includes(".")) || pos[0];
  }

  if (!pos || !pos.chr) {
    throw new Error("染色体位置情報が取得できませんでした");
  }

  return {
    symbol: hit.symbol || query,
    name: hit.name || "",
    chromosome: pos.chr,
    start: pos.start,
    end: pos.end,
    strand: pos.strand,
  };
}

function strandText(strand) {
  if (strand === 1 || strand === "+") return "プラス鎖 (+)";
  if (strand === -1 || strand === "-") return "マイナス鎖 (-)";
  return "不明";
}

function showError(message) {
  const errorEl = document.getElementById("error");
  errorEl.textContent = message;
  errorEl.classList.remove("hidden");
  document.getElementById("result").classList.add("hidden");
}

function hideError() {
  document.getElementById("error").classList.add("hidden");
}

function clearLoading() {
  document.getElementById("loading").classList.add("hidden");
}

function showLoading() {
  document.getElementById("loading").classList.remove("hidden");
  document.getElementById("error").classList.add("hidden");
  document.getElementById("result").classList.add("hidden");
}

function displayResult(info) {
  document.getElementById("gene-title").textContent = info.symbol;
  document.getElementById("chromosome-num").textContent = info.chromosome;
  document.getElementById("position").textContent = `${formatNumber(info.start)} - ${formatNumber(info.end)} bp`;
  document.getElementById("gene-name").textContent = info.name || "-";
  document.getElementById("strand").textContent = strandText(info.strand);

  drawChromosome(info.chromosome, info.start, info.end, info.symbol);

  document.getElementById("result").classList.remove("hidden");
}

document.getElementById("search-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const query = document.getElementById("gene-input").value.trim();
  if (!query) return;

  showLoading();

  try {
    const info = await fetchGeneInfo(query);
    displayResult(info);
  } catch (err) {
    showError(err.message);
  } finally {
    clearLoading();
  }
});
