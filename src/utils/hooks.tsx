import React from "react";
import {
  Cartesian3,
  Cartographic,
  Rectangle,
  Viewer,
  Math as M,
  Color,
} from "cesium";
import { geoToH3, h3Line, h3SetToMultiPolygon, kRing, polyfill } from "h3-js";
import { useState, useEffect, useRef } from "react";
import { useCookies } from "react-cookie";
import { useNavigate } from "react-router-dom";
import { CesiumComponentRef, CesiumMovementEvent } from "resium";
import { listenCookieChange } from "./cookieListener";
import wallet from "./wallet";
import { API_URL } from "./constants";
import { socketPulse } from "./socketPulse";
import { OwnedPolygon } from "./types";
const { fromCartesian } = Cartographic;
const { fromDegreesArray } = Cartesian3;

function getWindowDimensions() {
  const { innerWidth: width, innerHeight: height } = window;
  return {
    width,
    height,
  };
}

export function useWindowDimensions() {
  const [windowDimensions, setWindowDimensions] = useState(
    getWindowDimensions()
  );

  useEffect(() => {
    function handleResize() {
      setWindowDimensions(getWindowDimensions());
    }

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return windowDimensions;
}

export function controller() {
  const [cookies, setCookies, removeCookies] = useCookies(["token"]);
  const navigate = useNavigate();
  const ref = useRef<CesiumComponentRef<Viewer>>(null);
  const [index, setIndex] = useState<string>("");
  const [viewer, setViewer] = useState<Viewer>();
  const [polygons, setPolygons] = useState<any>([]);
  const [menu, setMenu] = useState<boolean>(false);
  const [modal, setModal] = useState<boolean>(false);
  const [confirmModal, setConfirmModal] = useState<boolean>(false);
  const [dot, setDot] = useState<Cartesian3>();
  const [clicked, setClicked] = useState<boolean>(false);
  const [selectedPolygons, setSelectedPolygons] = useState<any>([]);
  const [selectedPolygon, setSelectedPolygon] = useState<string>("");
  const [cameraRectangle, setCameraRectangle] = useState<Rectangle>();
  const [selectionStarted, setSelectionStarted] = useState<Cartesian3 | null>(
    null
  );
  const [areaSelection, setAreaSelection] = useState<any>([]);
  const [ownedPolygons, setOwnedPolygons] = useState<{
    geo: [] | number[][][][];
    hexagons: OwnedPolygon[];
  }>({
    geo: [],
    hexagons: [],
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [socket, setSocket] = useState<any>();
  const { width } = useWindowDimensions();
  const [altitude, setAltitude] = useState(9999);
  const [mobileSelection, setMobileSelection] = useState<boolean>(false);
  const [refreshConnection, setRefreshConnection] = useState<any>();
  useEffect(() => {
    if (!cookies.token) {
      return navigate("/login");
    }
    listenCookieChange(navigate);
    let socket = new WebSocket(API_URL);
    setSocket(socket);
    if (ref.current?.cesiumElement) {
      setViewer(ref.current.cesiumElement);
    }
    socketPulse(socket);
    socket.onopen = function (e) {
      console.log("[open] Connessione stabilita");
      console.log("Invio al server");
      socket.send(JSON.stringify({ data: [] }));
    };
    socket.onerror = function (error) {
      console.error(error);
    };
    socket.onclose = function (e) {
      console.log(e);
      console.log("Connesione chiusa");
      setRefreshConnection(1);
    };
    socket.onmessage = function (event) {
      try {
        const data = JSON.parse(event.data);
        if (Array.isArray(data.data) && data.data.length) {
          const multipolygons = h3SetToMultiPolygon(
            data.data.map((d: OwnedPolygon) => d.id),
            true
          );
          setOwnedPolygons({
            geo: multipolygons,
            hexagons: data.data,
          });
          if (cameraRectangle) {
            multipolygons
              .flat(3)
              .map((l) => Rectangle.contains(cameraRectangle, l));
          }
        }
      } catch (err) {
        console.log(err);
      }
    };
    return () => socket.close();
  }, [refreshConnection]);
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
    if (!mobileSelection) {
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
    const ownd = ownedPolygons.hexagons.map((p: { id: string }) => p.id);
    const uniqueData = data.filter((p) => {
      if (seen.has(p) || ownd.includes(p)) {
        return false;
      }
      seen.add(p);
      return true;
    });
    if (mobileSelection) {
      setMobileSelection(false);
    }
    setSelectedPolygons(uniqueData);
  }
  function mobileSelectionFinish() {
    if (mobileSelection && areaSelection.length && selectedPolygons.length) {
      onFinishSelection();
    }
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
      setAltitude(height);
      if (height < 1500) {
        const { toDegrees } = M;
        if (rect) {
          const boundaries: any = [
            [toDegrees(rect.north) + 0.001, toDegrees(rect.west) - 0.002],
            [toDegrees(rect.north) + 0.001, toDegrees(rect.east) + 0.002],
            [toDegrees(rect.south) - 0.001, toDegrees(rect.east) + 0.002],
            [toDegrees(rect.south) - 0.001, toDegrees(rect.west) - 0.002],
          ];
          const newPolygons = polyfill(boundaries, 12);
          setCameraRectangle(rect);
          checkIfOwnedPolygons(newPolygons);

          setPolygons(newPolygons);
        }
      } else if (height > 8000) {
        setAreaSelection([]);
        setOwnedPolygons({
          geo: [],
          hexagons: [],
        });
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
    if (e.startPosition && viewer) {
      if ((!mobileSelection && selectionStarted) || mobileSelection) {
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
            !ownedPolygons.hexagons
              .map((h: OwnedPolygon) => h.id)
              .includes(newIndex)
          ) {
            setSelectedPolygons([...selectedPolygons, newIndex]);
          }
          setAreaSelection([...areaSelection, cartesian]);
        }
      }
    }
  };
  const modalConfirmation = () => {
    setSelectedPolygons([]);
    setAreaSelection([]);
    setModal(false);
  };
  return {
    menu,
    modal,
    confirmModal,
    dot,
    loading,
    connectToWallet,
    onClick,
    onCameraChange,
    onBuyLand,
    onMouseMovement,
    modalConfirmation,
    polygons,
    selectedPolygons,
    ref,
    ownedPolygons,
    index,
    clicked,
    setDot,
    areaSelection,
    width,
    setLoading,
    removeCookies,
    setModal,
    setMenu,
    setConfirmModal,
    viewer,
    altitude,
    setMobileSelection,
    mobileSelection,
    mobileSelectionFinish,
  };
}
function uniq(a: String[]) {
  return Array.from(new Set(a));
}
export const ControlledRender = (
  polygons: String[],
  Element: React.ElementType
) => {
  const [hex, setHexs] = useState<{
    elements: JSX.Element[];
    strings: String[];
  }>({
    elements: [],
    strings: [],
  });
  useEffect(() => {
    let strings: String[] = [];
    let elementsArr: JSX.Element[] = [];
    let counter = 0;
    // if (!counter) {
    //   return setCount(polygons.length);
    // }
    const interval = setInterval(() => {
      if (counter > polygons.length) {
        clearInterval(interval);
      } else {
        let Hexagons: (JSX.Element | undefined)[];
        Hexagons = polygons.slice(counter, counter + 150).map((item) => {
          const i = item as String;

          if (strings.indexOf(i) === -1) {
            return <Element item={item} key={item} />;
          }
        });
        const arr = Hexagons.map((v) => {
          return v ? (v.key ? v.key.toString() : "") : "";
        });
        const Hexs = Hexagons as unknown as JSX.Element;
        counter += 150;
        elementsArr = elementsArr.concat(Hexs);
        strings = uniq(strings.concat(arr));
        setHexs({
          elements: elementsArr,
          strings: strings,
        });
      }
    }, 0);
    return () => clearInterval(interval);
  }, [polygons]);

  return hex.elements;
};
