import { describe, it, expect } from 'vitest';
import Polygon from 'ol/geom/Polygon';
import MultiPolygon from 'ol/geom/MultiPolygon';
import LineString from 'ol/geom/LineString';
import { cuerpoSldSinTexto, parsearSld, textoDeEtiqueta, zoomsDeEscala } from '@pages/maps/helpers/etiquetasSld';
import { puntoDeEtiqueta } from '@pages/maps/helpers/etiquetasDibujo';

const SLD = `<?xml version="1.0" encoding="UTF-8"?>
<sld:StyledLayerDescriptor xmlns:sld="http://www.opengis.net/sld" xmlns:ogc="http://www.opengis.net/ogc" version="1.0.0">
  <sld:NamedLayer>
    <sld:Name>general:regiones</sld:Name>
    <sld:UserStyle>
      <sld:Name>regiones</sld:Name>
      <sld:FeatureTypeStyle>
        <sld:Rule>
          <sld:PolygonSymbolizer><sld:Stroke><sld:CssParameter name="stroke">#8C87A6</sld:CssParameter></sld:Stroke></sld:PolygonSymbolizer>
        </sld:Rule>
        <sld:Rule>
          <sld:MinScaleDenominator>600000.0</sld:MinScaleDenominator>
          <sld:TextSymbolizer>
            <sld:Label><ogc:Function name="Concatenate"><ogc:PropertyName>num</ogc:PropertyName><ogc:Literal> - </ogc:Literal><ogc:PropertyName>region</ogc:PropertyName></ogc:Function></sld:Label>
            <sld:Font><sld:CssParameter name="font-size">11</sld:CssParameter><sld:CssParameter name="font-weight">bold</sld:CssParameter></sld:Font>
            <sld:Halo><sld:Radius>1.5</sld:Radius><sld:Fill><sld:CssParameter name="fill">#FFFFFF</sld:CssParameter></sld:Fill></sld:Halo>
            <sld:Fill><sld:CssParameter name="fill">#2B2B2B</sld:CssParameter></sld:Fill>
          </sld:TextSymbolizer>
        </sld:Rule>
      </sld:FeatureTypeStyle>
    </sld:UserStyle>
  </sld:NamedLayer>
</sld:StyledLayerDescriptor>`;

describe('etiquetas desde el SLD', () => {
    it('lee la regla de texto con su etiqueta, fuente, halo y escala', () => {
        const sld = parsearSld(SLD);
        expect(sld.nombre).toBe('general:regiones');
        expect(sld.estilo).toBe('regiones');
        expect(sld.reglas).toHaveLength(1);
        const [regla] = sld.reglas;
        expect(regla).toMatchObject({ tamano: 11, peso: 'bold', color: '#2B2B2B', halo: { radio: 1.5, color: '#FFFFFF' }, minEscala: 600000, maxEscala: null, filtrada: false });
        expect(textoDeEtiqueta(regla.partes, { num: 3, region: 'Altos Sur' })).toBe('3 - Altos Sur');
    });

    it('el SLD sin texto conserva la capa y el relleno pero no el TextSymbolizer', () => {
        const { capaSinTexto } = parsearSld(SLD);
        expect(capaSinTexto).toContain('general:regiones');
        expect(capaSinTexto).toContain('PolygonSymbolizer');
        expect(capaSinTexto).not.toContain('TextSymbolizer');
    });

    it('una capa sin UserStyle no es error y se declara solo por nombre', () => {
        const grupo = parsearSld('<sld:StyledLayerDescriptor xmlns:sld="http://www.opengis.net/sld"><sld:NamedLayer><sld:Name>general:limite_iieg</sld:Name></sld:NamedLayer></sld:StyledLayerDescriptor>');
        expect(grupo).toEqual({ nombre: 'general:limite_iieg', estilo: '', reglas: [], capaSinTexto: null });
        const cuerpo = cuerpoSldSinTexto([
            { nombre: 'general:limite_iieg', estilo: '', capaSinTexto: null },
            { nombre: 'general:cabeceras', estilo: 'cabeceras', capaSinTexto: null },
            { nombre: 'general:regiones', estilo: 'regiones', capaSinTexto: '<sld:NamedLayer>x</sld:NamedLayer>' },
        ]);
        expect(cuerpo).toContain('<sld:NamedLayer><sld:Name>general:limite_iieg</sld:Name></sld:NamedLayer>');
        expect(cuerpo).toContain('<sld:NamedStyle><sld:Name>cabeceras</sld:Name></sld:NamedStyle>');
        expect(cuerpo).toContain('<sld:NamedLayer>x</sld:NamedLayer>');
    });

    it('convierte las escalas de GeoServer a zooms de MapLibre', () => {
        expect(zoomsDeEscala(600000, null).maxzoom).toBeCloseTo(8.86, 1);
        const { minzoom, maxzoom } = zoomsDeEscala(70000, 550000);
        expect(minzoom).toBeCloseTo(8.99, 1);
        expect(maxzoom).toBeCloseTo(11.96, 1);
        expect(zoomsDeEscala(null, null)).toEqual({});
    });

    it('ubica la etiqueta dentro del poligono mayor y a la mitad de la linea', () => {
        const chico = [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]];
        const grande = [[[10, 10], [30, 10], [30, 30], [10, 30], [10, 10]]];
        const [x, y] = puntoDeEtiqueta(new MultiPolygon([chico, grande]));
        expect(x).toBeGreaterThan(10);
        expect(y).toBeGreaterThan(10);
        expect(puntoDeEtiqueta(new Polygon(chico))).toHaveLength(2);
        expect(puntoDeEtiqueta(new LineString([[0, 0], [10, 0]]))).toEqual([5, 0]);
    });
});
