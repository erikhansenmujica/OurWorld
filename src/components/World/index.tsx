import React, { memo, useEffect, useRef, useState } from "react";
import {
  Cartesian3,
  Cartographic,
  Color,
  Math as M,
  Material,
  Ion,
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
import styles from "../../App.module.css";
import { MenuContent } from "../MenuContent";
import { SideBar } from "../SideBar";
import { ModalContent } from "../ModalContent";
import { API_URL } from "../../utils/constants";
import wallet from "../../utils/wallet";
import { useCookies } from "react-cookie";
import { useNavigate } from "react-router-dom";
import { listenCookieChange } from "../../utils/cookieListener";
import { ConfirmModal } from "../ConfirmModal";
import { useWindowDimensions } from "../../utils/hooks";
declare let window: any;
Ion.defaultAccessToken =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIyMDZmMzY5Ni1mNjdmLTQyYjgtOGMyMi0xYTEyZjg4NTY3ZmQiLCJpZCI6ODQyNzUsImlhdCI6MTY0NjIwMzg1MX0.pO8Wx1N4Nd9UaewLRO3b5Ak2S7VEz5B4inpO1Nm6_lI"; // eslint-disable-line max-len

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
const OwnedFilledPolygons = memo(
  function Polygs(props: {
    polygons: [{ id: string; tier: number }];
    color: Color;
  }) {
    return (
      <PolylineCollection>
        {props.polygons.map((p: any) => (
          <OwnedFilledPolygon p={p.id} key={p.id} color={props.color} />
        ))}
      </PolylineCollection>
    );
  },
  (prevProps, nextProps) => {
    return prevProps.polygons.length === nextProps.polygons.length;
  }
);
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
export const World = () => {
  const [cookies, setCookies, removeCookies] = useCookies(["token"]);
  const navigate = useNavigate();
  const ref = useRef<CesiumComponentRef<Viwr>>(null);
  const [index, setIndex] = useState<string>("");
  const [viewer, setViewer] = useState<Viwr>();
  const [polygons, setPolygons] = useState<any>([]);
  const [menu, setMenu] = useState<boolean>(false);
  const [modal, setModal] = useState<boolean>(false);
  const [confirmModal, setConfirmModal] = useState<boolean>(false);
  const [dot, setDot] = useState<Cartesian3>();
  const [clicked, setClicked] = useState<boolean>(false);
  const [selectedPolygons, setSelectedPolygons] = useState<any>([]);
  const [selectedPolygon, setSelectedPolygon] = useState<string>("");
  const [selectionStarted, setSelectionStarted] = useState<Cartesian3 | null>(
    null
  );
  const [mobileSelectionStarted, setMobileSelectionStarted] =
    useState<Cartesian3 | null>(null);
  const [areaSelection, setAreaSelection] = useState<any>([]);
  const [ownedPolygons, setOwnedPolygons] = useState<any>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [socket, setSocket] = useState<any>();
  const { height, width } = useWindowDimensions();

  useEffect(() => {
    if (!cookies.token) {
      return navigate("/login");
    }
    listenCookieChange(navigate);
    let socket = new WebSocket("wss://middleware.ourworldmeta.com");
    setSocket(socket);
    if (ref.current?.cesiumElement) {
      setViewer(ref.current.cesiumElement);
    }
    socket.onopen = function (e) {
      console.log("[open] Connessione stabilita");
      console.log("Invio al server");
      socket.send(JSON.stringify({ data: [] }));
    };
    socket.onerror = function (error) {
      console.error(error);
    };
    socket.onmessage = function (event) {
      try {
        const data = JSON.parse(event.data);
        console.log(data);
        if (Array.isArray(data.data) && data.data.length) {
          setOwnedPolygons(data.data);
        }
      } catch (err) {
        console.log(err);
      }
    };
    return () => socket.close();
  }, []);
  const connectToWallet = async () => {
    if (typeof window.ethereum === "undefined") {
      setConfirmModal(true);
      return;
    }
    let res = await wallet.getAddress();
    if (!res) {
      let res = await wallet.connectWallet();
      let addToken = await wallet.addToken();
    }
  };
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
    const ownd = ownedPolygons.map((p: { id: string }) => p.id);
    const uniqueData = data.filter((p) => {
      if (seen.has(p) || ownd.includes(p)) {
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
    if (!polygons.length) setDot(newDot);
    return newIndex;
  }
  const checkIfOwnedPolygons = async (p: String[]) => {
    socket.send(
      JSON.stringify({
        operation: "rpc",
        type: "query",
        data: p,
      })
    );
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
        setAreaSelection([]);
        setOwnedPolygons([]);
        setDot(undefined);
        setPolygons([]);
        setClicked(false);
        setSelectionStarted(null);
      } else {
        setDot(undefined);
        setAreaSelection([]);
        setSelectionStarted(null);
        setPolygons([]);
        setClicked(false);
      }
    }
  };
  const onBuyLand = async () => {
    setLoading(true);
    socket.send(
      JSON.stringify({
        operation: "rpc",
        type: "create",
        data: selectedPolygons,
      })
    );
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
  const onMobileSelection = (e: CesiumMovementEvent) => {
    // if (e.startPosition && viewer) {
    //   const cartesian: Cartesian3 | undefined =
    //     viewer.scene.camera.pickEllipsoid(e.startPosition);
    //   if (cartesian) {
    //     setMobileSelectionStarted(cartesian);
    //   }
    // }
  };
  const onMobileFinishSelection = (e: CesiumMovementEvent) => {
    // if (e.startPosition && viewer) {
    //   const cartesian: Cartesian3 | undefined =
    //     viewer.scene.camera.pickEllipsoid(e.startPosition);
    //   if (cartesian) {
    //     setMobileSelectionStarted(null);
    //   }
    // }
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
        <OwnedFilledPolygons
          polygons={ownedPolygons}
          color={Color.RED.withAlpha(0.4)}
        />
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
          <ScreenSpaceEvent
            action={onMobileSelection}
            type={ScreenSpaceEventType.LEFT_DOWN}
          />
          <ScreenSpaceEvent
            action={onMobileFinishSelection}
            type={ScreenSpaceEventType.LEFT_UP}
          />
        </ScreenSpaceEventHandler>
        <Camera onMoveEnd={async () => await onCameraChange()}></Camera>
      </Viewer>
      <motion.div
        className={styles.sideMenuContainer}
        initial={false}
        animate={{ width: menu ? (width > 800 ? "25%" : "70%") : "2%" }}
      >
        <MenuContent
          onBuyLand={onBuyLand}
          selectedPolygons={selectedPolygons}
          menu={menu}
          loading={loading}
          setLoading={setLoading}
          removeCookies={removeCookies}
          connectToWallet={connectToWallet}
          setModal={setModal}
        />
        <SideBar menu={menu} setMenu={setMenu} />
      </motion.div>
      <motion.div
        className={styles.modalContainer}
        initial={false}
        animate={{
          right: modal ? (width > 800 ? "30%" : "10%") : 0,
          width: modal ? (width > 800 ? "40%" : "80%") : 0,
        }}
      >
        <ModalContent
          setModal={setModal}
          selectedPolygons={selectedPolygons}
          modal={modal}
          modalConfirmation={modalConfirmation}
        />
      </motion.div>
      <motion.div
        className={styles.modalContainer}
        initial={false}
        animate={{
          right: confirmModal ? (width > 800 ? "30%" : "10%") : 0,
          width: confirmModal ? (width > 800 ? "40%" : "80%") : 0,
        }}
      >
        <ConfirmModal
          setModal={setConfirmModal}
          modal={confirmModal}
          selectedPolygons={selectedPolygons}
          modalConfirmation={modalConfirmation}
        />
      </motion.div>
    </div>
  );
};
