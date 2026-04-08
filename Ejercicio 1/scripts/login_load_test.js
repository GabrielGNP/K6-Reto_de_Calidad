import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';
import { SharedArray } from 'k6/data';
import papaparse from 'https://jslib.k6.io/papaparse/5.1.1/index.js';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js';


const errorRate      = new Rate('error_rate');
const responseTimeTrend = new Trend('response_time_ms', true);
const failedRequests = new Counter('failed_requests');


const usuarios = new SharedArray('usuarios', function () {
  const csv = open('../data/usuarios.csv');
  return papaparse.parse(csv, { header: true, skipEmptyLines: true }).data;
});

const base_url = 'https://fakestoreapi.com';
export const options = {
  scenarios: {
    carga_login: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '10s',  target: 10  }, // Rampa de subida
        { duration: '15s',  target: 30  }, // Carga sostenida
        { duration: '15s',  target: 50  }, // Pico
        { duration: '10s',  target: 0   }, // Bajada
      ],
      gracefulRampDown: '30s',
    },
  },
  thresholds: {
    'http_req_duration': ['p(95)<1500'],
    'error_rate': ['rate<0.03'],
    'response_time_ms': ['p(90)<1500'],
  },
};

export default function () {
  const usuario = usuarios[__VU % usuarios.length];

  const url = `${base_url}/auth/login`;
  const payload = JSON.stringify({
    username: usuario.user,
    password: usuario.passwd,
  });
  const params  = {
    headers: { 'Content-Type': 'application/json' },
    timeout: '10s',
  };

  const res = http.post(url, payload, params);

  check(res, {
    'status 201': (r) => r.status === 201,
    'tiene token': (r) => JSON.parse(r.body).token !== undefined,
    'tiempo de respuesta < 1500ms':  (r) => r.timings.duration < 1500,
  });

  const ok = check(res, {
    'status 201':                    (r) => r.status === 201,
    'tiene token':                   (r) => {
      try { return JSON.parse(r.body).token !== undefined; } catch { return false; }
    },
    'tiempo de respuesta < 1500ms':  (r) => r.timings.duration < 1500,
  });

  errorRate.add(!ok);
  responseTimeTrend.add(res.timings.duration);

  if (!ok) {
    failedRequests.add(1);
    console.warn(
      `FALLO | VU:${__VU} | usuario:${usuario.user} | ` +
      `status:${res.status} | tiempo:${res.timings.duration.toFixed(0)}ms`
    );
  }

  sleep(0.5);
}


export function handleSummary(data) {
  const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  return {
    [`../reports/summary_${ts}.json`]: JSON.stringify(data, null, 2),
    stdout: textSummary(data, { indent: ' ', enableColors: true }) + 
      '\n \n \n' + 
      getCustomSummary(data),
  };
}


function getCustomSummary(data) {
  const lines = ['======= RESUMEN ESTADÍSTICO DE PRUEBA DE CARGA ======='];
  const m = data.metrics;

  const fmt = (v) => (v !== undefined ? v.toFixed(2) : 'N/A');

  lines.push(`Peticiones totales  : ${m.http_reqs?.values?.count ?? 'N/A'}`);
  lines.push(`TPS promedio        : ${fmt(m.http_reqs?.values?.rate)} req/s`);
  lines.push(`Errores             : ${fmt((m.error_rate?.values?.rate ?? 0) * 100)} %`);
  lines.push(`Duración avg        : ${fmt(m.http_req_duration?.values?.avg)} ms`);
  lines.push(`Duración p90        : ${fmt(m.http_req_duration?.values['p(90)'])} ms`);
  lines.push(`Duración p95        : ${fmt(m.http_req_duration?.values['p(95)'])} ms`);
  lines.push(`Duración máx        : ${fmt(m.http_req_duration?.values?.max)} ms`);
  lines.push('========================================================\n');

  return lines.join('\n');
}
