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

function drawChromosomePath(cx, top, height, width) {
  const halfW = width / 2;
  const cy = top + height / 2;
  const bottom = top + height;

  return `
    M ${cx - halfW + 6} ${top}
    Q ${cx - halfW} ${top} ${cx - halfW} ${top + 6}
    L ${cx - halfW} ${cy - 10}
    Q ${cx - halfW + 4} ${cy} ${cx - halfW + 6} ${cy + 3}
    L ${cx - halfW + 6} ${bottom - 6}
    Q ${cx - halfW} ${bottom} ${cx - halfW + 6} ${bottom}
    L ${cx + halfW - 6} ${bottom}
    Q ${cx + halfW} ${bottom} ${cx + halfW} ${bottom - 6}
    L ${cx + halfW - 6} ${cy + 3}
    Q ${cx + halfW - 4} ${cy} ${cx + halfW} ${cy - 10}
    L ${cx + halfW} ${top + 6}
    Q ${cx + halfW} ${top} ${cx + halfW - 6} ${top}
    Z
  `;
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

  // Chromosome body
  const body = document.createElementNS("http://www.w3.org/2000/svg", "path");
  body.setAttribute("d", drawChromosomePath(diagramCenterX, diagramTop, diagramHeight, chromosomeWidth));
  body.setAttribute("fill", "url(#chromosomeGradientDetail)");
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

function drawKaryotype(selectedChr) {
  const svg = document.getElementById("karyotype-svg");
  const group = document.getElementById("karyotype-group");
  group.innerHTML = "";

  const svgWidth = 1000;
  const pairsPerRow = 6;
  const topMargin = 24;
  const bottomMargin = 24;
  const rowHeight = 90;
  const labelSpace = 28;
  const rowGap = 20;
  const rowTotal = rowHeight + labelSpace + rowGap;
  const chrWidth = 22;
  const pairGap = 18;

  const maxLength = CHROMOSOME_LENGTHS[1];
  const pairDefinitions = [
    [1, 1], [2, 2], [3, 3], [4, 4], [5, 5], [6, 6],
    [7, 7], [8, 8], [9, 9], [10, 10], [11, 11], [12, 12],
    [13, 13], [14, 14], [15, 15], [16, 16], [17, 17], [18, 18],
    [19, 19], [20, 20], [21, 21], [22, 22], ["X", "Y"],
  ];

  const rowCount = Math.ceil(pairDefinitions.length / pairsPerRow);
  const svgHeight = topMargin + rowCount * rowTotal + bottomMargin;
  svg.setAttribute("viewBox", `0 0 ${svgWidth} ${svgHeight}`);

  const colWidth = svgWidth / pairsPerRow;
  const normalizedSelected = normalizeChromosome(selectedChr);

  pairDefinitions.forEach((pair, index) => {
    const row = Math.floor(index / pairsPerRow);
    const col = index % pairsPerRow;
    const pairCenterX = col * colWidth + colWidth / 2;
    const pairTopY = topMargin + row * rowTotal;

    const isPairSelected =
      (String(pair[0]) === String(normalizedSelected)) ||
      (normalizedSelected === "Y" && String(pair[0]) === "X"); // 23番目は [X, Y]

    pair.forEach((chr, side) => {
      const length = getChromosomeLength(chr);
      if (!length) return;

      const height = Math.max(10, (length / maxLength) * rowHeight);
      const cx = pairCenterX + (side === 0 ? -1 : 1) * (chrWidth / 2 + pairGap / 2);
      const isSelected = normalizeChromosome(chr) === normalizedSelected;
      const fill = isSelected ? "url(#highlightGradient)" : "url(#chromosomeGradient)";
      const stroke = isSelected ? "#991b1b" : "#2563eb";

      const body = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      body.setAttribute("x", cx - chrWidth / 2);
      body.setAttribute("y", pairTopY);
      body.setAttribute("width", chrWidth);
      body.setAttribute("height", height);
      body.setAttribute("rx", Math.min(5, height / 2));
      body.setAttribute("ry", Math.min(5, chrWidth / 2));
      body.setAttribute("fill", fill);
      body.setAttribute("stroke", stroke);
      body.setAttribute("stroke-width", isSelected ? "2" : "1.2");
      group.appendChild(body);

      const centromere = document.createElementNS("http://www.w3.org/2000/svg", "line");
      const cy = pairTopY + height / 2;
      centromere.setAttribute("x1", cx - chrWidth / 2 - 4);
      centromere.setAttribute("y1", cy);
      centromere.setAttribute("x2", cx + chrWidth / 2 + 4);
      centromere.setAttribute("y2", cy);
      centromere.setAttribute("stroke", isSelected ? "#7f1d1d" : "#1e40af");
      centromere.setAttribute("stroke-width", "2");
      group.appendChild(centromere);
    });

    // Pair label
    const labelText = index === 22 ? "XY" : String(pair[0]);
    const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
    label.setAttribute("x", pairCenterX);
    label.setAttribute("y", pairTopY + rowHeight + 22);
    label.setAttribute("text-anchor", "middle");
    label.setAttribute("font-size", "26");
    label.setAttribute("fill", isPairSelected || (normalizedSelected === "Y" && labelText === "XY") ? "#991b1b" : "#1f2937");
    label.setAttribute("font-weight", isPairSelected || (normalizedSelected === "Y" && labelText === "XY") ? "bold" : "normal");
    label.textContent = labelText;
    group.appendChild(label);
  });

  document.getElementById("karyotype-caption").textContent =
    `ヒトカリオタイプ 46,XY。23対（46本）を配置し、染色体 ${selectedChr} に位置する ${selectedChr === "Y" ? "Y" : "遺伝子"} を赤で強調しています。`;
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
  const length = getChromosomeLength(info.chromosome);
  document.getElementById("gene-title").textContent = info.symbol;
  document.getElementById("chromosome-num").textContent = info.chromosome;
  document.getElementById("position").textContent =
    `${formatNumber(info.start)} - ${formatNumber(info.end)} bp（大きさ: ${length ? formatNumber(length) : "不明"} bp）`;
  document.getElementById("gene-name").textContent = info.name || "-";
  document.getElementById("strand").textContent = strandText(info.strand);

  drawKaryotype(info.chromosome);
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
