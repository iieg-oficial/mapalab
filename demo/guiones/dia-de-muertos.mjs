// Día de Muertos (~13 s): pan mordido, altar con flores tumbadas, papel picado y un cempasúchil.

const PAN = { name: 'Activar Día de Muertos' };

export default {
    url: 'https://iieg.jalisco.gob.mx/mapalab/mapa',
    cursor: { x: 700, y: 420 },

    // Tema apagado y página limpia: las flores tumbadas solo vuelven al recargar.
    async preparar({ page, esperar }) {
        const quitar = page.getByRole('button', { name: 'Quitar Día de Muertos' });
        if (await quitar.count()) await quitar.first().click();
        await page.reload({ waitUntil: 'load' });
        await page.getByRole('button', PAN).first().waitFor();
        await esperar(5000);
    },

    async escena({ page, viewport, esperar, caja, cajas, moverA, clic, enfocar, alejar, seguir, buscar, centro, union }) {
        // 1. Pan de muerto mordido.
        const pan = centro(await caja(page.getByRole('button', PAN)));
        await esperar(200);
        enfocar(2.6, pan, 0.9);
        await moverA(pan, 900);
        await esperar(250);
        await clic(pan, 50);
        await esperar(800);
        alejar();
        await esperar(1200);

        // 2. El altar: tres flores tumbadas. La ofrenda va con aria-hidden, así que getByRole no la ve.
        const flores = (await cajas(page.locator('button[aria-label="Tumbar flor"]'))).sort((a, b) => a.x - b.x);
        const altar = union(flores);
        enfocar(4.5, { x: centro(altar).x, y: centro(altar).y + 8 }, 0.9);
        await moverA(centro(altar), 800);
        for (const f of [flores[1], flores[Math.floor(flores.length / 2)], flores[flores.length - 2]]) {
            await clic(centro(f), 350);
            await esperar(450);
        }
        await esperar(400);

        // 3. El papel picado aletea al pasarle el cursor.
        const cordel = union(await cajas(page.locator('.muertos-colgante')));
        enfocar(2.8, centro(cordel), 0.8);
        const fila = cordel.y + cordel.height * 0.55;
        await moverA({ x: cordel.x - 10, y: fila }, 600);
        await moverA({ x: cordel.x + cordel.width + 10, y: fila + 10 }, 1400);
        await esperar(500);

        // 4. Un cempasúchil cayendo: el visor suelta uno cada 8 s, así que en este tramo hay uno.
        const flor = await buscar(page.locator('.muertos-flor-cae'), (b) => b.y > 30 && b.y < viewport.alto - 150);
        if (flor) await seguir(flor, { ms: 1900, zoom: 3.5 });
        alejar(0.7);
        await esperar(600);
    },
};
