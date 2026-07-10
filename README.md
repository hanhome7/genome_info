# Genome Info

遺伝子コードを入力すると、対象遺伝子が染色体の何番に位置するかを図で表示する Web アプリです。

## 機能

- 遺伝子名（例: `BRCA1`, `TP53`）や NCBI Gene ID、Ensembl ID などを入力
- MyGene.info API から遺伝子情報を取得
- 染色体番号と位置を表示
- SVG で染色体全体と遺伝子の位置を可視化

## 使い方

### ローカルで実行

```bash
python3 -m http.server 9100
```

ブラウザで `http://localhost:9100` を開きます。

### FastAPI で実行

```bash
pip install -r requirements.txt
uvicorn app:app --port 9100 --reload
```

ブラウザで `http://localhost:9100` を開きます。

## データソース

- [MyGene.info](https://mygene.info)
- 染色体長は GRCh38 を参照

## 例

入力例:
- `BRCA1`
- `TP53`
- `672`
- `ENSG00000012048`
