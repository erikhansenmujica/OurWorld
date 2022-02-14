import React, { memo, useEffect, useRef, useState } from "react";
import {
  Cartesian3,
  Cartographic,
  Color,
  Math as M,
  Material,
  ScreenSpaceEventType,
  Rectangle,
  Viewer as Viwr,
} from "cesium";
import {
  CesiumMovementEvent,
  Entity,
  Viewer,
  PolygonGraphics,
  CameraFlyTo,
  PolylineCollection,
  Polyline,
  ScreenSpaceEventHandler,
  ScreenSpaceEvent,
  Camera,
  CesiumComponentRef,
} from "resium";

import { motion } from "framer-motion";
import { geoToH3, h3Line, h3ToGeoBoundary, kRing, polyfill } from "h3-js";
import axios from "axios";
import styles from "./App.module.css";
import { MenuContent } from "./components/MenuContent";
import { SideBar } from "./components/SideBar";
import { ModalContent } from "./components/ModalContent";
import { API_URL } from "./utils/constants";
const { fromDegreesArray } = Cartesian3;
const { fromCartesian } = Cartographic;
const getBoundary = (index: string) =>
  h3ToGeoBoundary(index)
    .map(([lat, lon]) => [lon, lat])
    .reduce((list, latLon) => [...list, ...latLon], []);
const PolyLines = memo(function Polygs(props: { polygons: [string] }) {
  return (
    <PolylineCollection>
      {props.polygons.map((p: string) => (
        <Polyline
          key={p}
          material={Material.fromType("Color", {
            color: Color.WHITE.withAlpha(0.2),
          })}
          positions={fromDegreesArray(getBoundary(p))}
          width={1}
        ></Polyline>
      ))}
    </PolylineCollection>
  );
});
const FilledPolygons = memo(function Polygs(props: { polygons: [string] }) {
  return (
    <PolylineCollection>
      {props.polygons.map((p: any) => (
        <FilledPolygon p={p} key={p} />
      ))}
    </PolylineCollection>
  );
});
const OwnedFilledPolygons = memo(function Polygs(props: {
  polygons: [string];
  color: Color;
}) {
  return (
    <PolylineCollection>
      {props.polygons.map((p: any) => (
        <OwnedFilledPolygon p={p} key={p} color={props.color} />
      ))}
    </PolylineCollection>
  );
});
const OwnedFilledPolygon = memo(function Polyg(props: {
  p: string;
  color: Color;
}) {
  return (
    <Entity>
      <PolygonGraphics
        hierarchy={{
          positions: fromDegreesArray(getBoundary(props.p)),
          holes: [],
        }}
        material={props.color}
        height={2}
      ></PolygonGraphics>
    </Entity>
  );
});
const FilledPolygon = memo(function Polyg(props: { p: string }) {
  return (
    <Entity>
      <PolygonGraphics
        hierarchy={{
          positions: fromDegreesArray(getBoundary(props.p)),
          holes: [],
        }}
        material={Color.BLACK.withAlpha(0.4)}
        height={2}
      ></PolygonGraphics>
    </Entity>
  );
});
const App = () => {
  const ref = useRef<CesiumComponentRef<Viwr>>(null);
  const [index, setIndex] = useState<string>("");
  const [viewer, setViewer] = useState<Viwr>();
  const [polygons, setPolygons] = useState<any>([]);
  const [menu, setMenu] = useState<boolean>(false);
  const [modal, setModal] = useState<boolean>(false);
  const [dot, setDot] = useState<Cartesian3>();
  const [clicked, setClicked] = useState<boolean>(false);
  const [selectedPolygons, setSelectedPolygons] = useState<any>([]);
  const [selectedPolygon, setSelectedPolygon] = useState<string>("");
  const [selectionStarted, setSelectionStarted] = useState<Cartesian3 | null>(
    null
  );
  const [areaSelection, setAreaSelection] = useState<any>([]);
  const [ownedPolygons, setOwnedPolygons] = useState<any>([]);
  const [loading, setLoading] = useState<boolean>(false);
  useEffect(() => {
    if (ref.current?.cesiumElement) {
      setViewer(ref.current.cesiumElement);
    }
  }, []);
  var scratchRectangle = new Rectangle();
  const onClick = (data: CesiumMovementEvent) => {
    if (viewer && viewer.scene) {
      let cartesian;
      if (data.position)
        cartesian = viewer.scene.camera.pickEllipsoid(data.position);
      if (cartesian) {
        const zeroIndex = newIndexGenerator(cartesian, 8);
        const newIndex = newIndexGenerator(cartesian, 12);
        const polygon: number = selectedPolygons.indexOf(newIndex);
        const arr: [] = JSON.parse(JSON.stringify(selectedPolygons));
        if (newIndex === selectedPolygon) {
          arr.splice(polygon, 1);
          setSelectedPolygons(arr);
        } else if (newIndex !== selectedPolygon) {
          setSelectedPolygon(newIndex);
        }
        const height = fromCartesian(viewer.scene.camera.position).height;

        if (!selectedPolygons.length && height < 1500) {
          setSelectionStarted(cartesian);
        }
        if (selectedPolygons.length && !selectionStarted) {
          const neighbors = kRing(newIndex, 1).filter((n: string) => {
            if (selectedPolygons.includes(n) && n !== newIndex) return true;
          });
          if (neighbors.length <= 4 && polygon >= 0) {
            arr.splice(polygon, 1);
            setSelectedPolygons(arr);
          } else if (neighbors.length >= 2 && polygon === -1) {
            setSelectedPolygons([...selectedPolygons, newIndex]);
          } else if (height < 1500) {
            if (selectedPolygons.length) {
              setModal(true);
            } else {
              setSelectedPolygons([]);
              setSelectionStarted(cartesian);
              setAreaSelection([]);
            }
          }
        } else if (polygons.length && selectionStarted) {
          setSelectionStarted(null);
          if (areaSelection.length && selectedPolygons.length) {
            onFinishSelection();
          }
        }
        if (zeroIndex !== index) {
          setIndex(zeroIndex);
          if (!clicked) {
            setClicked(true);
          }
        }
      }
    }
  };
  function onFinishSelection() {
    setAreaSelection([...areaSelection, areaSelection[0]]);
    const { toDegrees } = M;
    const boundaries: any = [];
    areaSelection.forEach((b: Cartesian3) => {
      const { latitude, longitude } = fromCartesian(b);
      const newPosition = {
        latitude: toDegrees(latitude),
        longitude: toDegrees(longitude),
      };
      boundaries.push([newPosition.latitude, newPosition.longitude]);
    });
    const seen = new Set();
    const data = [
      ...selectedPolygons,
      ...h3Line(
        selectedPolygons[0],
        selectedPolygons[selectedPolygons.length - 1]
      ),
      ...polyfill(boundaries, 12),
    ];
    const uniqueData = data.filter((p) => {
      if (seen.has(p) || ownedPolygons.includes(p)) {
        return false;
      }
      seen.add(p);
      return true;
    });
    setSelectedPolygons(uniqueData);
  }
  function newIndexGenerator(cartesian: Cartesian3, resolution: any) {
    const { toDegrees } = M;
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

    return newIndex;
  }
  const checkIfOwnedPolygons = async (p: String[]) => {
    const res = await axios.post(API_URL + "/selections/in/boundaries", {
      data: p,
    });
    setOwnedPolygons(res.data.map((p: any) => p.index));
  };
  const onCameraChange = async () => {
    if (viewer) {
      const rect = viewer.camera.computeViewRectangle(
        viewer.scene.globe.ellipsoid,
        scratchRectangle
      );
      const height = fromCartesian(viewer.scene.camera.position).height;
      if (height < 1500) {
        const { toDegrees } = M;
        if (rect) {
          const boundaries: any = [
            [toDegrees(rect.north), toDegrees(rect.west)],
            [toDegrees(rect.north), toDegrees(rect.east)],
            [toDegrees(rect.south), toDegrees(rect.east)],
            [toDegrees(rect.south), toDegrees(rect.west)],
          ];
          const newPolygons = polyfill(boundaries, 12);
          await checkIfOwnedPolygons(newPolygons);

          setPolygons(newPolygons);
        }
      } else if (height > 8000) {
        setOwnedPolygons([]);
      } else {
        setDot(undefined);
        setPolygons([]);
        setClicked(false);
      }
    }
  };
  const onBuyLand = async () => {
    setLoading(true);
    await axios.post(API_URL + "/selections/new", {
      userId: "1",
      ownedTiles: selectedPolygons,
    });
    await checkIfOwnedPolygons(polygons);
    setSelectedPolygons([]);
    setAreaSelection([]);
    setLoading(false);
  };
  const onMouseMovement = (e: CesiumMovementEvent) => {
    if (e.startPosition && selectionStarted && viewer) {
      const cartesian: Cartesian3 | undefined =
        viewer.scene.camera.pickEllipsoid(e.startPosition);
      const { toDegrees } = M;
      if (cartesian) {
        const { latitude, longitude } = fromCartesian(cartesian);
        const newPosition = {
          latitude: toDegrees(latitude),
          longitude: toDegrees(longitude),
        };
        const newIndex = geoToH3(
          newPosition.latitude,
          newPosition.longitude,
          12
        );
        if (
          !selectedPolygons.includes(newIndex) &&
          !ownedPolygons.includes(newIndex)
        ) {
          setSelectedPolygons([...selectedPolygons, newIndex]);
        }
        setAreaSelection([...areaSelection, cartesian]);
      }
    }
  };
  const modalConfirmation = () => {
    setSelectedPolygons([]);
    setAreaSelection([]);
    setModal(false);
  };
  return (
    <div>
      <Viewer
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          height: "calc(100%)",
        }}
        timeline={false}
        ref={ref}
        onClick={onClick}
      >
        {polygons.length && <PolyLines polygons={polygons} />}
        {selectedPolygons.length && (
          <FilledPolygons polygons={selectedPolygons} />
        )}
        {ownedPolygons.length && (
          <OwnedFilledPolygons
            polygons={ownedPolygons}
            color={Color.RED.withAlpha(0.4)}
          />
        )}
        {index && dot && !clicked && (
          <CameraFlyTo
            onComplete={() => setDot(undefined)}
            destination={Cartesian3.fromDegrees(
              M.toDegrees(fromCartesian(dot).longitude),
              M.toDegrees(fromCartesian(dot).latitude),
              1450
            )}
            duration={1}
          />
        )}
        <PolylineCollection>
          {areaSelection && (
            <Polyline
              material={Material.fromType("Color", {
                color: Color.GREEN,
              })}
              positions={areaSelection}
              width={8}
            ></Polyline>
          )}
        </PolylineCollection>
        <ScreenSpaceEventHandler>
          <ScreenSpaceEvent
            action={onMouseMovement}
            type={ScreenSpaceEventType.MOUSE_MOVE}
          />
        </ScreenSpaceEventHandler>
        <Camera onMoveEnd={async () => await onCameraChange()}></Camera>
      </Viewer>
      <motion.div
        className={styles.sideMenuContainer}
        initial={false}
        animate={{ width: menu ? "25%" : "2%" }}
      >
        <MenuContent
          onBuyLand={onBuyLand}
          selectedPolygons={selectedPolygons}
          menu={menu}
          loading={loading}
          setLoading={setLoading}
        />
        <SideBar menu={menu} setMenu={setMenu} />
      </motion.div>
      <motion.div
        className={styles.modalContainer}
        initial={false}
        animate={{ right: modal ? "30%" : 0, width: modal ? "40%" : 0 }}
      >
        <ModalContent
          setModal={setModal}
          selectedPolygons={selectedPolygons}
          modal={modal}
          modalConfirmation={modalConfirmation}
        />
      </motion.div>
    </div>
  );
};

export default App;
