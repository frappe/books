async function getPDF(doctype, name) {
    const headers = {
        'Accept': 'application/pdf',
        'Content-Type': 'application/json'
    }

    const res = await fetch('/api/method/pdf', {
        method: 'POST',
        headers,
        body: JSON.stringify({ doctype, name })
    });

    const blob = await res.blob();
    showFile(blob);
}


function showFile(blob, filename='file.pdf') {
    const newBlob = new Blob([blob], { type: "application/pdf" })
    const data = window.URL.createObjectURL(newBlob);
    const link = document.createElement('a');
    link.href = data;
    link.download = filename;
    link.click();
    setTimeout(() => window.URL.revokeObjectURL(data), 100);
}

module.exports = {
    getPDF
}
