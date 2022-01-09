import React, { useState } from "react";
import { Cartesian3, Cartographic, Color, Math, HeightReference } from "cesium";
import {
  CesiumMovementEvent,
  Entity,
  Viewer,
  PolygonGraphics,
  PointGraphics,
} from "resium";
import { geoToH3, h3ToGeoBoundary, h3IsValid, polyfill } from "h3-js";
import { resColor, resolutions } from "./utils/colors";
const { fromDegreesArray, fromDegrees } = Cartesian3;
const { fromCartesian } = Cartographic;

const App = () => {
  let viewer: any;
  const [index, setIndex] = useState<string>("");
  const [res, setRes] = useState<keyof typeof resColor>(0);
  const [polygons, setPolygons] = useState<any>([]);
  const [dot, setDot] = useState<Cartesian3>();
  const [dotBelongingIndex, setDotBelongingIndex] = useState<string>("");
  const TRANSPARENCY = 0.4;
  const material = Color.BLACK.withAlpha(TRANSPARENCY);

  const getBoundary = (index: string) =>
    h3ToGeoBoundary(index)
      .map(([lat, lon]) => [lon, lat])
      .reduce((list, latLon) => [...list, ...latLon], []);
  const onClick = (data: CesiumMovementEvent) => {
    if (viewer) {
      const cartesian = viewer.scene.camera.pickEllipsoid(data.position);
      if (cartesian) {
        const zeroIndex = newIndexGenerator(cartesian, 0);
        if (zeroIndex === index) {
          const newI = newIndexGenerator(cartesian, res);
          polygonOnClick(newI, cartesian);
        } else {
          setRes(0);
          setPolygons([]);
          setIndex(zeroIndex);
        }
      }
    }
  };
  const polygonOnClick = (newIndex: string, cartesian: Cartesian3) => {
    if (
      Array.isArray(polygons) &&
      !polygons.includes(newIndex) &&
      res !== 0 &&
      res !== 1
    ) {
      let num = resolutions[res - 2];
      let newRes = num;
      const newI = newIndexGenerator(cartesian, newRes);
      newIndexGenerator(cartesian, newRes + 1);
      setPolygons(polyfill(h3ToGeoBoundary(newI), newRes + 1));
      if (newRes in resColor) {
        setRes(newRes + 1);
      }
    } else if (
      Array.isArray(polygons) &&
      !polygons.includes(newIndex) &&
      res === 1
    ) {
      const newI = newIndexGenerator(cartesian, res - 1);
      setPolygons(polyfill(h3ToGeoBoundary(newI), res));
    } else if (
      Array.isArray(polygons) &&
      polygons.includes(newIndex) &&
      res !== 0 &&
      newIndex !== dotBelongingIndex
    ) {
    } else {
      let num = resolutions[res + 1];
      let newRes = num;
      newIndexGenerator(cartesian, newRes);
      setPolygons(polyfill(h3ToGeoBoundary(newIndex), newRes));
      if (newRes in resColor) {
        setRes(newRes);
      }
    }
  };

  function newIndexGenerator(cartesian: Cartesian3, resolution: any) {
    const { toDegrees } = Math;
    const { latitude, longitude } = fromCartesian(cartesian);
    const newPosition = {
      latitude: toDegrees(latitude),
      longitude: toDegrees(longitude),
    };
    const newIndex = geoToH3(
      newPosition.latitude,
      newPosition.longitude,
      resolution
    );
    const newDot = cartesian;
    setDot(undefined);
    setDot(newDot);
    setDotBelongingIndex(newIndex);
    return newIndex;
  }
  return (
    <Viewer
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        height: "calc( 100%  )",
      }}
      timeline={false}
      ref={(e) => (viewer = e ? e.cesiumElement : undefined)}
      onClick={onClick}
    >
      {h3IsValid(index) && (
        <Entity
          description={"H3 Hexagon: {res: 0, h3index: " + index + " }"}
          polygon={{
            hierarchy: {
              positions: fromDegreesArray(getBoundary(index)),
              holes: [],
            },
            material,
          }}
        />
      )}
      {polygons.length &&
        polygons.map((p: any, i: number) => (
          <Entity key={i} description="H3 Hexagon">
            <PolygonGraphics
              hierarchy={{
                positions: fromDegreesArray(getBoundary(p)),
                holes: [],
              }}
              material={
                p === dotBelongingIndex
                  ? Color.GREEN.withAlpha(TRANSPARENCY)
                  : resColor[res]
              }
            ></PolygonGraphics>
          </Entity>
        ))}
      {dot && (
        <Entity
          name="dot"
          description={
            "Dot, belongs in res " + res + " to h3 index " + dotBelongingIndex
          }
          position={dot}
          selected
        >
          <PointGraphics
            disableDepthTestDistance={0}
            pixelSize={10}
            color={Color.RED}
            heightReference={HeightReference.RELATIVE_TO_GROUND}
          ></PointGraphics>
        </Entity>
      )}
    </Viewer>
  );
};

export default App;
