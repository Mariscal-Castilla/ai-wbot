export const byteToSize = (bytes) => {
	if (bytes >= 1000000000) { bytes = (bytes / 1000000000).toFixed(2) + " GB"; }
	else if (bytes >= 1000000) { bytes = (bytes / 1000000).toFixed(2) + " MB"; }
	else if (bytes >= 1000) { bytes = (bytes / 1000).toFixed(2) + " KB"; }
	else if (bytes > 1) { bytes = bytes + " bytes"; }
	else if (bytes == 1) { bytes = bytes + " byte"; }
	else { bytes = "0 bytes"; }
	return bytes;
};

export const convertTimeOut = () => {
    var segundos = Math.floor(ms / 1000);
    var minutos = Math.floor(segundos / 60);
    var horas = Math.floor(minutos / 60);
    var dias = Math.floor(horas / 24);
    var semanas = Math.floor(dias / 7);
    segundos %= 60;
    minutos %= 60;
    horas %= 24;
    dias %= 7;
    var resultado = "";
    if (semanas !== 0) { resultado += semanas + (semanas === 1 ? " semana, " : " semanas, ") }
    if (dias !== 0) { resultado += dias + (dias === 1 ? " dia, " : " dias, ") }
    if (horas !== 0) { resultado += horas + (horas === 1 ? " hora, " : " horas, ") }
    if (minutos !== 0) { resultado += minutos + (minutos === 1 ? " minuto, " : " minutos, ") }
    if (segundos !== 0 || resultado === "") { resultado += segundos + (segundos === 1 ? " segundo" : " segundos") }
    return resultado;
}
