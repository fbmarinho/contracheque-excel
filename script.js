// script.js

// Definir o caminho para o worker do PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.10.377/pdf.worker.min.js";

// Função para carregar e ler o PDF
async function loadPDF(file) {
	const reader = new FileReader();
	reader.readAsArrayBuffer(file);
	return new Promise((resolve, reject) => {
		reader.onload = async function () {
			const typedArray = new Uint8Array(this.result);
			console.log("Arquivo PDF lido com sucesso."); // Log 1: Confirmação de leitura do arquivo
			const pdf = await pdfjsLib.getDocument(typedArray).promise;
			console.log("PDF carregado com sucesso."); // Log 2: Confirmação de carregamento do PDF
			const numPages = pdf.numPages;
			var table = [];

			for (let p = 1; p <= numPages; p++) {
				const page = await pdf.getPage(p);
				const textContent = (await page.getTextContent()).items.filter((o) => o.str.trim() != "");

				const contrachequevalido = textContent.findIndex((o) => o.str.trim() == "DISCRIMINAÇÃO DO PAGAMENTO NA COMPETÊNCIA");

				if (contrachequevalido == -1) {
					alert("Não é um contracheque válido !");
					return null;
				}

				const startText = "Salario Base";
				const endText = ["Margem Consignada para Emprestimo", "Valor Líquido"];

				const startIndex = textContent.findIndex((o) => o.str.trim() == startText) - 1;
				const endIndex = textContent.findIndex((o) => endText.includes(o.str.trim())) - 2;
				console.log("conteudo: ", textContent, startIndex, endIndex);

				const discountCodes = [1113, 1116, 600, 629, 630, 760, 762, 947, 749, 1200, 610, 756, 244, 764, 774, 680];

				for (var i = startIndex; i <= endIndex; i = i + 4) {
					const codigo = parseInt(textContent[i].str.trim());
					const descricao = textContent[i + 1].str.trim();
					const referencia = parseFloat(textContent[i + 3].str.trim());
					const moeda = parseFloat(textContent[i + 2].str.trim().replace(".", ""));
					const proventos = discountCodes.includes(codigo) ? null : moeda;
					const descontos = discountCodes.includes(codigo) ? moeda : null;
					table.push({ codigo, descricao, referencia, proventos, descontos });
				}
				//console.log(table);
			}
			resolve(table);
		};
		reader.onerror = (error) => {
			console.error("Erro ao ler o PDF:", error); // Log de erro de leitura
			reject(error);
		};
	});
}

// Função para exibir os dados na tabela
function displayData(data) {
	const tableBody = document.getElementById("tableBody");
	tableBody.innerHTML = ""; // Limpar tabela antes de adicionar novos dados

	if (data.length === 0) {
		console.log("Nenhum dado processado para exibir."); // Log se não houver dados
		return;
	}

	data.forEach((row) => {
		const tr = document.createElement("tr");

		Object.values(row).forEach((value, i) => {
			const td = document.createElement("td");
			//console.log(typeof value, i);
			td.textContent = i < 3 ? value : typeof value != "object" ? value.toFixed(2) : "";
			tr.appendChild(td);
		});

		tableBody.appendChild(tr);
	});

	console.log("Dados exibidos na tabela."); // Log final após exibir os dados
}

// Função para copiar os dados da tabela para o clipboard
function copyToClipboard() {
	// Pega a tabela gerada
	const table = document.querySelector("table");
	if (!table) {
		alert("Nenhuma tabela gerada para copiar!");
		return;
	}

	// Cria um array para armazenar o conteúdo da tabela
	let rows = [];
	// Pega as linhas da tabela
	const rowsData = table.querySelectorAll("tr");

	// Itera pelas linhas
	rowsData.forEach((row) => {
		// Pega as células da linha
		const cols = row.querySelectorAll("th, td");
		let rowContent = [];

		// Itera pelas células e adiciona o conteúdo ao array
		cols.forEach((col) => rowContent.push(col.innerText));

		// Junta o conteúdo das células com tabulações
		rows.push(rowContent.join("\t"));
	});

	// Junta as linhas com quebras de linha
	const tableText = rows.join("\n");

	// Cria um elemento de textarea temporário para copiar o conteúdo
	const tempTextArea = document.createElement("textarea");
	tempTextArea.value = tableText;
	document.body.appendChild(tempTextArea);

	// Seleciona e copia o conteúdo do textarea
	tempTextArea.select();
	document.execCommand("copy");
	document.body.removeChild(tempTextArea);

	alert("Tabela copiada para a área de transferência! Cole no Excel.");
}

// Event listeners
document.getElementById("pdfInput").addEventListener("change", async (e) => {
	const input = e.currentTarget;
	if (input.files.length !== 0) {
		console.log("Processando PDF:", input.value);
		const data = await loadPDF(input.files[0]);
		displayData(data);
	}
});

document.getElementById("copyBtn").addEventListener("click", copyToClipboard);
