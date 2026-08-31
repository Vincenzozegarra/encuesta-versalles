#!/bin/sh
# Chequeo rápido del backend de la encuesta. Uso: sh test.sh
KEY="sb_publishable_SjOE5lvfh0fyyDRHQMc23w_ItvE2Yb4"
URL="https://cvijxlgdshfwqszbqgkr.supabase.co"

echo "1) Personal visible (debe listar nombres):"
curl -s "$URL/rest/v1/encuesta_personal?select=nombre&activo=eq.true" -H "apikey: $KEY" -H "Authorization: Bearer $KEY"
echo

echo "2) Lectura directa de respuestas con anon (debe ser []):"
curl -s "$URL/rest/v1/encuesta_respuestas?select=id" -H "apikey: $KEY" -H "Authorization: Bearer $KEY"
echo

echo "3) RPC con clave mala (debe decir 'clave incorrecta'):"
curl -s -X POST "$URL/rest/v1/rpc/encuesta_admin" -H "apikey: $KEY" -H "Authorization: Bearer $KEY" -H "Content-Type: application/json" -d '{"p_clave":"x"}'
echo
