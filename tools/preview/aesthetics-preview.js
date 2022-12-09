/*
 * Copyright 2022 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

const aesServiceUrl = 'https://webpage-aesthetics-ns-team-xpsuccess-sandbox.corp.ethos13-stage-va7.ethos.adobe.net/aesthetics/predict?apiKey=xpsucc3ss&url=';
const defaultHost ='https://main--gw22-aesthetics-scoring-franklin--chicharr.hlx.page';

/**
 * Retrieves the content of a metadata tag.
 * @param {string} name The metadata name (or property)
 * @returns {string} The metadata value
 */
 export function getMetadata(name) {
  const attr = name && name.includes(':') ? 'property' : 'name';
  const meta = document.head.querySelector(`meta[${attr}="${name}"]`);
  return meta && meta.content;
}

/**
 * Loads a CSS file.
 * @param {string} href The path to the CSS file
 */
 export function loadCSS(href, callback) {
  if (!document.querySelector(`head > link[href="${href}"]`)) {
    const link = document.createElement('link');
    link.setAttribute('rel', 'stylesheet');
    link.setAttribute('href', href);
    if (typeof callback === 'function') {
      link.onload = (e) => callback(e.type);
      link.onerror = (e) => callback(e.type);
    }
    document.head.appendChild(link);
  } else if (typeof callback === 'function') {
    callback('noop');
  }
}


function createScoreElement(scoreName, score) {  
  const div = document.createElement('div');
  div.className = `hlx-variant`;
  let scores = '';
  score.aesthetics_scores.forEach((entry) => {
    const fname = entry.feature_name;
    const fvalue = entry.feature_value;
    scores = scores.concat(`<p>${fname}: ${fvalue}</p>`);  
  });
  div.innerHTML = `<div>
    <h5><code>${scoreName}</code></h5>
      ${scores}
    </div>`
  return (div);  
}

/**
 * Create Badge for Aesth Scoring
 * @return {Object} returns a badge or empty string
 */
async function createAesthScoring() {
  const div = document.createElement('div');
  div.className = 'hlx-experiment hlx-badge';
  div.classList.add(`hlx-experiment-status-active`);
  div.innerHTML = `Aesthetics Scoring: <span class="hlx-open"></span>
    <div class="hlx-popup hlx-hidden">
    <div class="hlx-variants"></div>
    </div>`;

  const popup = div.querySelector('.hlx-popup');
  div.addEventListener('click', () => {
    popup.classList.toggle('hlx-hidden');
  });
  const variantsDiv = div.querySelector('.hlx-variants')
  let url = window.location.href;
  if (url.includes('https://localhost:3000')) {
    url = url.replace('http://localhost:3000', defaultHost);
  }
  // Get live scoring
  const liveUrl = url.replace('.hlx.page', '.hlx.live'); 
  const liveScoring = await getAestheticsScoring(liveUrl);
  if (liveScoring) {
    variantsDiv.appendChild(createScoreElement('Live', liveScoring));
  }
  // Get preview scoring
  const prevScoring = await getAestheticsScoring(window.location+"?aesthetics=disabled");      
  variantsDiv.appendChild(createScoreElement('Preview', prevScoring));  
  return (div);
}

async function getAestheticsScoring(url) {    
  const startTime = new Date();

  console.log("calling aesthetics scoring for url: " + url);
  const res = await fetch(aesServiceUrl + encodeURIComponent(url));
  if (res.ok) {
    const data = await res.json();    
    const endTime = new Date();
    const timeDiff = endTime - startTime; //in ms
    console.log("time to get the score " + timeDiff + " ms.");
    return data;          
  }
  console.log("request failed");
}


/**
 * Decorates Preview mode badges and overlays
 * @return {Object} returns a badge or empty string
 */
async function decoratePreviewMode() {
  const params = new URLSearchParams(window.location.search);
  if(params.get('aesthetics')==='disabled') {
    return;
  }
  loadCSS('/tools/preview/aesthetics-preview.css');
  const overlay = document.createElement('div');
  overlay.className = 'hlx-preview-overlay';
  overlay.append(await createAesthScoring());
  document.body.append(overlay);
}

try {
  decoratePreviewMode();
} catch (e) {
  // eslint-disable-next-line no-console
  console.log(e);
}
