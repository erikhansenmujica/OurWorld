import {
  Cartesian2,
  Cartesian3,
  Viewer,
  Math as M,
  Cartographic,
} from "cesium";
import Rectangle from "cesium/Source/Core/Rectangle";
import { h3ToGeoBoundary, polyfill } from "h3-js";
import { resColor } from "./colors";

export const polygonOnClick = (
  newIndex: string,
  dotBelongingIndex: string,
  cartesian: Cartesian3,
  setPolygons: any,
  setRes: any,
  polygons: any,
  resolutions: any,
  res: any,
  newIndexGenerator: any
) => {
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
const createRectangleBoundaries = (
  startPosition: Cartesian3,
  endPosition: Cartesian2,
  viewer: Viewer,
  selectedPolygons: [],
  setSelectedPolygons: any
) => {
  const { fromCartesian } = Cartographic;
  // let newIndex: string;
  // if (e.startPosition) {
  //   let cartesian = viewer.scene.camera.pickEllipsoid(e.startPosition);
  //   if (cartesian) {
  //     newIndex = newIndexGenerator(cartesian, 12);
  //     if (newIndex !== hoverPolygon) {
  //       console.log(newIndex !== hoverPolygon);
  //       createRectangleBoundaries(selectionStarted, e.startPosition);
  //       setHoverPolygon(newIndex);
  //     }
  //   }
  // }
  if (viewer) {
    if (endPosition) {
      const cartesian = viewer.scene.camera.pickEllipsoid(endPosition);
      const { toDegrees } = M;
      var e = new Rectangle();
      var firstPos = fromCartesian(startPosition);
      if (cartesian) {
        var mousePos = fromCartesian(cartesian);
        e.west = Math.min(firstPos.longitude, mousePos.longitude);
        e.east = Math.max(firstPos.longitude, mousePos.longitude);
        e.south = Math.min(firstPos.latitude, mousePos.latitude);
        e.north = Math.max(firstPos.latitude, mousePos.latitude);
        const boundaries = [
          [toDegrees(e.north), toDegrees(e.west)],
          [toDegrees(e.north), toDegrees(e.east)],
          [toDegrees(e.south), toDegrees(e.east)],
          [toDegrees(e.south), toDegrees(e.west)],
        ];
        const newPolygons = polyfill(boundaries, 12);
        if (selectedPolygons.length && newPolygons.length < 1000) {
          setSelectedPolygons(newPolygons);
        } else if (!selectedPolygons.length) {
          setSelectedPolygons(newPolygons);
        }
      }
    }
  }
};
