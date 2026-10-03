// DICIONÁRIO DE EMOJIS (Carrega do arquivo local na raiz)
let emojiMap = {};

async function loadEmojis() {
    let cached = localStorage.getItem('cales_unicode_emojis');
    if (cached) {
        try {
            emojiMap = JSON.parse(cached);
            return;
        } catch (e) {}
    }

    try {
        let response = await fetch('./emojis.json');
        if (response.ok) {
            emojiMap = await response.json();
            localStorage.setItem('cales_unicode_emojis', JSON.stringify(emojiMap));
        }
    } catch (err) {
        console.log('Erro ao carregar o arquivo de emojis.');
    }
}

// 1. CARREGAR CONTEÚDO SALVO AO ABRIR A PÁGINA
window.addEventListener('DOMContentLoaded', function() {
    loadEmojis();

    let savedContent = localStorage.getItem('cales_documento_html');
    if (savedContent && savedContent.trim() !== '') {
        let placeholder = document.getElementById('placeholder-inicial');
        if (placeholder) placeholder.remove();

        let tempDiv = document.createElement('div');
        tempDiv.innerHTML = savedContent;
        
        while (tempDiv.firstChild) {
            document.body.appendChild(tempDiv.firstChild);
        }
    }
    checkPlaceholder();
});

// 2. FUNÇÃO DE SALVAMENTO AUTOMÁTICO NO LOCALSTORAGE
function autoSave() {
    let bodyClone = document.body.cloneNode(true);
    let ph = bodyClone.querySelector('#placeholder-inicial');
    if (ph) ph.remove();

    localStorage.setItem('cales_documento_html', bodyClone.innerHTML);
}

// Funções auxiliares para o dicionário de vocabulário (word)
function getVocabulary() {
    let vocab = localStorage.getItem('cales_vocabulario');
    return vocab ? JSON.parse(vocab) : {};
}

function saveVocabulary(vocab) {
    localStorage.setItem('cales_vocabulario', JSON.stringify(vocab));
}

// Funções auxiliares para o dicionário de plurais (counter)
function getCounters() {
    let counters = localStorage.getItem('cales_contadores');
    return counters ? JSON.parse(counters) : {};
}

function saveCounters(counters) {
    localStorage.setItem('cales_contadores', JSON.stringify(counters));
}

// Função auxiliar para verificar se a página está sem conteúdo real
function checkPlaceholder() {
    let placeholder = document.getElementById('placeholder-inicial');
    let contentElements = document.body.querySelectorAll('p:not(#placeholder-inicial), h1, h2, h3, h4, h5, h6, ul, table, hr, img, video, .aviso-box');
    
    if (contentElements.length === 0) {
        if (!placeholder) {
            let newPlaceholder = document.createElement('p');
            newPlaceholder.id = 'placeholder-inicial';
            newPlaceholder.innerHTML = `<strong>Duplo clique para começar a escrever...!</strong><br><em>Guia rápido de tags e comandos:</em><br>• **negrito** | *itálico* | ~riscado~ | \`código\`<br>• # Título (até ######) | > Item de lista | --- (linha divisória)<br>• tab T1: linha1/linha2 | T2: linha1/linha2 (tabelas)<br>• @https://exemplo.com (ou @url | texto do link)<br>• -! Texto de atenção -! (caixa de aviso)<br>• Use #fire ou #thinking em <em>qualquer lugar</em> do texto!<br>• <strong>word chave = significado</strong> (tradução) | <strong>word chave</strong> (reutilizar)<br>• <strong>counter chave = plural</strong> (plural) | <strong>counter chave</strong> (reutilizar)<br>• <strong>word chave = delete</strong> ou <strong>counter chave = delete</strong> (apaga do dicionário)<br>• <strong>date</strong> (insere a data de hoje) | <strong>date-time</strong> (insere data e hora)<br>• <strong>!delete</strong> (apaga todo o conteúdo e o cache da página)`;
            document.body.appendChild(newPlaceholder);
        }
    } else {
        if (placeholder) {
            placeholder.remove();
        }
    }
    autoSave();
}

// Ativa a edição com duplo clique
document.addEventListener('dblclick', function(event) {
    let target = event.target;

    if (target.id === 'placeholder-inicial') {
        target.removeAttribute('id');
        target.innerHTML = '';
        target.setAttribute('contenteditable', 'true');
        target.focus();
        return;
    }

    let avisoBox = target.closest('.aviso-box');
    if (avisoBox) {
        let textEl = avisoBox.querySelector('.aviso-texto');
        let content = textEl ? textEl.innerHTML : '';
        
        content = content.replace(/<strong>(.*?)<\/strong>/g, '**$1**')
                         .replace(/<em>(.*?)<\/em>/g, '*$1*')
                         .replace(/<del>(.*?)<\/del>/g, '~$1~')
                         .replace(/<span class="code-inline">(.*?)<\/span>/g, '`$1`');

        let pTemp = document.createElement('p');
        pTemp.innerHTML = `-! ${content} -!`;
        avisoBox.replaceWith(pTemp);
        target = pTemp;
        target.setAttribute('contenteditable', 'true');
        target.focus();
        return;
    }

    if (target === document.body || target === document.documentElement) {
        let placeholder = document.getElementById('placeholder-inicial');
        if (placeholder) placeholder.remove();

        let newP = document.createElement('p');
        newP.setAttribute('contenteditable', 'true');
        newP.innerHTML = '';
        document.body.appendChild(newP);
        newP.focus();
        return;
    }

    if (target.getAttribute('contenteditable') !== 'true') {
        let content = '';

        let table = target.closest('table');
        if (table && target.tagName !== 'TABLE') {
            target = table;
        }

        let hr = target.closest('hr');
        if (hr) {
            target = hr;
        }

        if (target.tagName === 'TABLE') {
            let headers = [];
            let columnsData = [];

            let ths = target.querySelectorAll('th');
            ths.forEach(th => headers.push(th.innerHTML));

            let rows = target.querySelectorAll('tbody tr');
            if (rows.length === 0) rows = target.querySelectorAll('tr');

            headers.forEach(() => columnsData.push([]));

            rows.forEach((row) => {
                let tds = row.querySelectorAll('td');
                tds.forEach((td, colIndex) => {
                    if (columnsData[colIndex]) {
                        let cellHtml = td.innerHTML
                            .replace(/<strong>(.*?)<\/strong>/g, '**$1**')
                            .replace(/<em>(.*?)<\/em>/g, '*$1*')
                            .replace(/<del>(.*?)<\/del>/g, '~$1~')
                            .replace(/<span class="code-inline">(.*?)<\/span>/g, '`$1`');
                        columnsData[colIndex].push(cellHtml);
                    }
                });
            });

            let tabParts = [];
            headers.forEach((header, index) => {
                let cleanHeader = header.replace(/<strong>(.*?)<\/strong>/g, '**$1**');
                let colStr = (columnsData[index] || []).join('/');
                tabParts.push(`${cleanHeader}: ${colStr}`);
            });

            content = 'tab ' + tabParts.join(' | ');
            
            let pTemp = document.createElement('p');
            pTemp.innerHTML = content;
            target.replaceWith(pTemp);
            target = pTemp;
        } else if (target.tagName === 'LI') {
            content = '> ' + target.innerHTML;
            content = content.replace(/<strong>(.*?)<\/strong>/g, '**$1**')
                             .replace(/<em>(.*?)<\/em>/g, '*$1*')
                             .replace(/<del>(.*?)<\/del>/g, '~$1~')
                             .replace(/<span class="code-inline">(.*?)<\/span>/g, '`$1`');
            let pTemp = document.createElement('p');
            pTemp.innerHTML = content;
            let ulParent = target.closest('ul');
            if (ulParent) {
                ulParent.replaceWith(pTemp);
            } else {
                target.replaceWith(pTemp);
            }
            target = pTemp;
        } else if (target.tagName === 'HR') {
            let pTemp = document.createElement('p');
            pTemp.innerHTML = '---';
            target.replaceWith(pTemp);
            target = pTemp;
        } else if (target.tagName === 'A') {
            content = '@' + target.href;
            if (target.textContent !== target.href) {
                content += ' | ' + target.textContent;
            }
            target.innerHTML = content;
        } else if (target.tagName === 'IMG') {
            let pTemp = document.createElement('p');
            pTemp.setAttribute('contenteditable', 'true');
            pTemp.innerHTML = '@' + target.src;
            target.replaceWith(pTemp);
            checkPlaceholder();
            return;
        } else if (target.tagName === 'VIDEO') {
            let source = target.querySelector('source');
            let videoSrc = source ? source.src : target.src;
            let pTemp = document.createElement('p');
            pTemp.setAttribute('contenteditable', 'true');
            pTemp.innerHTML = '@' + videoSrc;
            target.replaceWith(pTemp);
            checkPlaceholder();
            return;
        } else {
            content = target.innerHTML;
            
            let headingMatch = content.match(/^<h([1-6])>(.*?)<\/h[1-6]>$/);
            if (headingMatch) {
                let level = parseInt(headingMatch[1]);
                let text = headingMatch[2];
                content = '#'.repeat(level) + ' ' + text;
            } else {
                content = content.replace(/<strong>(.*?)<\/strong>/g, '**$1**');
                content = content.replace(/<em>(.*?)<\/em>/g, '*$1*');
                content = content.replace(/<del>(.*?)<\/del>/g, '~$1~');
                content = content.replace(/<span class="code-inline">(.*?)<\/span>/g, '`$1`');
            }
            target.innerHTML = content;
        }

        target.setAttribute('contenteditable', 'true');
        target.focus();
    }
});

function parseFormatting(text) {
    if (!text) return '';
    
    // Substitui #tags de emojis em QUALQUER LUGAR do texto
    text = text.replace(/#([a-zA-Z0-9_-]+)/g, function(match, name) {
        let key = name.toLowerCase();
        return emojiMap[key] || match;
    });

    return text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/(?<!\*)\*(?!\*)(.*?)(?<!\*)\*(?!\*)/g, '<em>$1</em>')
        .replace(/~(.*?)~/g, '<del>$1</del>')
        .replace(/`(.*?)`/g, '<span class="code-inline">$1</span>');
}

// Quando clica fora (perde o foco), processa as tags, comandos especiais e atualiza
document.addEventListener('focusout', function(event) {
    let target = event.target;

    if (target.getAttribute('contenteditable') === 'true') {
        target.removeAttribute('contenteditable');
        
        let htmlContent = target.innerHTML.trim();

        // Se a linha estiver vazia
        if (htmlContent === '') {
            let allElements = document.body.querySelectorAll('p:not(#placeholder-inicial), h1, h2, h3, h4, h5, h6, ul, table, hr, img, video, .aviso-box');
            if (allElements.length > 1) {
                target.remove();
            }
            checkPlaceholder();
            return;
        }

        // COMANDO GLOBAL: !delete
        if (htmlContent === '!delete') {
            if (confirm('Deseja apagar todo o documento e dicionários salvos?')) {
                localStorage.removeItem('cales_documento_html');
                localStorage.removeItem('cales_vocabulario');
                localStorage.removeItem('cales_contadores');
                localStorage.removeItem('cales_unicode_emojis');
                location.reload();
            } else {
                target.remove();
                checkPlaceholder();
            }
            return;
        }
        
                // COMANDO: !download, !export ou !save (Gera PDF formatado)
        if (htmlContent === '!download' || htmlContent === '!export' || htmlContent === '!save') {
            // Remove a linha do comando para não aparecer no PDF
            target.remove();
            checkPlaceholder();

            // Desativa temporariamente o contenteditable de qualquer elemento ativo
            let editables = document.querySelectorAll('[contenteditable="true"]');
            editables.forEach(el => el.removeAttribute('contenteditable'));

            // Aguarda um instante para o DOM atualizar e chama a impressão nativa formatada
            setTimeout(() => {
                window.print();
                checkPlaceholder();
            }, 200);
            return;
        }

        // COMANDO: date
        if (htmlContent === 'date') {
            let now = new Date();
            let formattedDate = String(now.getDate()).padStart(2, '0') + '/' + 
                                String(now.getMonth() + 1).padStart(2, '0') + '/' + 
                                now.getFullYear();
            target.textContent = formattedDate;
            checkPlaceholder();
            return;
        }

        // COMANDO: date-time
        if (htmlContent === 'date-time') {
            let now = new Date();
            let formattedDate = String(now.getDate()).padStart(2, '0') + '/' + 
                                String(now.getMonth() + 1).padStart(2, '0') + '/' + 
                                now.getFullYear();
            let formattedTime = String(now.getHours()).padStart(2, '0') + ':' + 
                                String(now.getMinutes()).padStart(2, '0');
            target.textContent = formattedDate + ' - ' + formattedTime;
            checkPlaceholder();
            return;
        }

        // COMANDO: -! Texto -!
        if (htmlContent.startsWith('-!') && htmlContent.endsWith('!-')) {
            let innerText = htmlContent.substring(2, htmlContent.length - 2).trim();
            let parsedText = parseFormatting(innerText);

            let avisoDiv = document.createElement('div');
            avisoDiv.className = 'aviso-box';
            avisoDiv.style.border = '2px solid #e67e22';
            avisoDiv.style.backgroundColor = '#fef5e7';
            avisoDiv.style.padding = '12px 16px';
            avisoDiv.style.borderRadius = '8px';
            avisoDiv.style.margin = '15px 0';
            avisoDiv.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)';

            let titleEl = document.createElement('div');
            titleEl.style.fontWeight = 'bold';
            titleEl.style.color = '#d35400';
            titleEl.style.marginBottom = '6px';
            titleEl.style.fontSize = '1.05em';
            titleEl.textContent = 'Atenção!';

            let textEl = document.createElement('div');
            textEl.className = 'aviso-texto';
            textEl.style.color = '#333';
            textEl.innerHTML = parsedText;

            avisoDiv.appendChild(titleEl);
            avisoDiv.appendChild(textEl);

            target.replaceWith(avisoDiv);
            checkPlaceholder();
            return;
        }

        // Divisão entre textos: ---
        if (htmlContent === '---') {
            let hr = document.createElement('hr');
            target.replaceWith(hr);
            checkPlaceholder();
            return;
        }

        // Criação de Lista com >
        if (htmlContent.startsWith('> ')) {
            let itemText = parseFormatting(htmlContent.substring(2));
            let li = document.createElement('li');
            li.innerHTML = itemText;

            let ul = document.createElement('ul');
            ul.appendChild(li);
            target.replaceWith(ul);
            checkPlaceholder();
            return;
        }

        // Processamento de Vocabulário Tradução (word)
        if (htmlContent.startsWith('word ')) {
            let definitionPart = htmlContent.substring(5).trim();
            
            if (definitionPart.includes('=')) {
                let parts = definitionPart.split('=').map(p => p.trim());
                let key = parts[0];
                let value = parts[1];

                if (key && value) {
                    let vocab = getVocabulary();

                    if (value.toLowerCase() === 'delete') {
                        if (vocab[key] !== undefined) {
                            delete vocab[key];
                            saveVocabulary(vocab);
                        }
                        let allElements = document.body.querySelectorAll('p:not(#placeholder-inicial), h1, h2, h3, h4, h5, h6, ul, table, hr, img, video, .aviso-box');
                        if (allElements.length > 1) {
                            target.remove();
                        }
                        checkPlaceholder();
                        return;
                    }

                    vocab[key] = value;
                    saveVocabulary(vocab);

                    htmlContent = parseFormatting(value);
                    target.innerHTML = htmlContent;
                    checkPlaceholder();
                    return;
                }
            } else {
                let key = definitionPart;
                let vocab = getVocabulary();

                if (vocab[key] !== undefined) {
                    let value = vocab[key];
                    htmlContent = parseFormatting(value);
                    target.innerHTML = htmlContent;
                    checkPlaceholder();
                    return;
                }
            }
        }

        // Processamento de Plurais (counter)
        if (htmlContent.startsWith('counter ')) {
            let definitionPart = htmlContent.substring(8).trim();
            
            if (definitionPart.includes('=')) {
                let parts = definitionPart.split('=').map(p => p.trim());
                let key = parts[0];
                let value = parts[1];

                if (key && value) {
                    let counters = getCounters();

                    if (value.toLowerCase() === 'delete') {
                        if (counters[key] !== undefined) {
                            delete counters[key];
                            saveCounters(counters);
                        }
                        let allElements = document.body.querySelectorAll('p:not(#placeholder-inicial), h1, h2, h3, h4, h5, h6, ul, table, hr, img, video, .aviso-box');
                        if (allElements.length > 1) {
                            target.remove();
                        }
                        checkPlaceholder();
                        return;
                    }

                    counters[key] = value;
                    saveCounters(counters);

                    htmlContent = parseFormatting(value);
                    target.innerHTML = htmlContent;
                    checkPlaceholder();
                    return;
                }
            } else {
                let key = definitionPart;
                let counters = getCounters();

                if (counters[key] !== undefined) {
                    let value = counters[key];
                    htmlContent = parseFormatting(value);
                    target.innerHTML = htmlContent;
                    checkPlaceholder();
                    return;
                }
            }
        }

        // Geração de Tabela via `tab ...`
        if (htmlContent.startsWith('tab ')) {
            let rawTabContent = htmlContent.substring(4);
            let cols = rawTabContent.split('|');
            
            let headers = [];
            let columnsRows = [];
            let maxRows = 0;

            cols.forEach(col => {
                let parts = col.split(':');
                if (parts.length >= 2) {
                    let headerTitle = parseFormatting(parts[0].trim());
                    let rowsData = parts[1].split('/').map(r => parseFormatting(r.trim()));
                    
                    headers.push(headerTitle);
                    columnsRows.push(rowsData);
                    if (rowsData.length > maxRows) maxRows = rowsData.length;
                }
            });

            if (headers.length > 0) {
                let tableHtml = '<table>\n<thead>\n<tr>';
                headers.forEach(h => {
                    tableHtml += `<th>${h}</th>`;
                });
                tableHtml += '</tr>\n</thead>\n<tbody>\n';

                for (let r = 0; r < maxRows; r++) {
                    tableHtml += '<tr>';
                    for (let c = 0; c < headers.length; c++) {
                        let cellValue = (columnsRows[c] && columnsRows[c][r]) !== undefined ? columnsRows[c][r] : '';
                        tableHtml += `<td>${cellValue}</td>`;
                    }
                    tableHtml += '</tr>\n';
                }
                tableHtml += '</tbody>\n</table>';

                let tempDiv = document.createElement('div');
                tempDiv.innerHTML = tableHtml;
                target.replaceWith(tempDiv.firstElementChild);
                checkPlaceholder();
                return;
            }
        }

        // Links e Mídias com @
        if (htmlContent.startsWith('@')) {
            let linkData = htmlContent.substring(1).trim();
            let parts = linkData.split('|').map(p => p.trim());
            let url = parts.shift();
            let label = parts.join(' | ') || url;

            let lowerUrl = url.toLowerCase();
            let isImage = /\.(png|jpg|jpeg|webp|gif)(\?.*)?$/i.test(lowerUrl) || lowerUrl.includes('giphy.com/media') || lowerUrl.includes('tenor.com/view');
            let isVideo = /\.(mp4|webm|ogg)(\?.*)?$/i.test(lowerUrl);

            if (isImage) {
                let img = document.createElement('img');
                img.src = url;
                img.alt = label !== url ? label : 'GIF / Imagem';
                img.style.maxWidth = '100%';
                img.style.borderRadius = '6px';
                img.style.margin = '10px 0';
                target.replaceWith(img);
                checkPlaceholder();
                return;
            } else if (isVideo) {
                let video = document.createElement('video');
                video.src = url;
                video.controls = true;
                video.style.maxWidth = '100%';
                video.style.borderRadius = '6px';
                video.style.margin = '10px 0';
                target.replaceWith(video);
                checkPlaceholder();
                return;
            } else {
                let a = document.createElement('a');
                a.href = url;
                a.textContent = label;
                a.target = '_blank';
                a.rel = 'noopener noreferrer';
                target.replaceWith(a);
                checkPlaceholder();
                return;
            }
        }

        // Processamento de Títulos (#, ##, ###, etc.) - Só vira título se começar com `#` seguido de espaço, evitando conflito com emojis no início
        let headingMatch = htmlContent.match(/^(#{1,6})\s+(.+)$/);
        if (headingMatch) {
            // Verifica se a primeira tag é um emoji puro antes de virar título (ex: "#fire é legal" não é título)
            let firstWordMatch = headingMatch[2].match(/^([a-zA-Z0-9_-]+)$/);
            if (!(headingMatch[1].length === 1 && emojiMap[firstWordMatch ? firstWordMatch[1].toLowerCase() : ''])) {
                let level = headingMatch[1].length;
                let text = parseFormatting(headingMatch[2]);
                let heading = document.createElement(`h${level}`);
                heading.innerHTML = text;
                target.replaceWith(heading);
                checkPlaceholder();
                return;
            }
        }

        // Formatações normais de parágrafo (aplica o parseFormatting completo com emojis em qualquer lugar)
        htmlContent = parseFormatting(htmlContent);
        target.innerHTML = htmlContent;
        checkPlaceholder();
    }
});