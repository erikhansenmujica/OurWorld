import React, { memo } from "react";
import {
  Cartesian3,
  Cartographic,
  Color,
  Math as M,
  Material,
  Ion,
  ScreenSpaceEventType,
  CameraEventType,
} from "cesium";
import {
  Entity,
  Viewer,
  PolygonGraphics,
  CameraFlyTo,
  PolylineCollection,
  Polyline,
  ScreenSpaceEventHandler,
  ScreenSpaceEvent,
  Camera,
  ScreenSpaceCameraController,
} from "resium";
import { motion } from "framer-motion";
import { h3ToGeoBoundary } from "h3-js";
import styles from "../../App.module.css";
import { MenuContent } from "../MenuContent";
import { SideBar } from "../SideBar";
import { ModalContent } from "../ModalContent";
import { ConfirmModal } from "../ConfirmModal";
import { controller } from "../../utils/hooks";
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
  const {
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
  } = controller();
  console.log(width);
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
        </ScreenSpaceEventHandler>
        <ScreenSpaceCameraController
          rotateEventTypes={
            width > 800 ? CameraEventType.LEFT_DRAG : CameraEventType.PINCH
          }
        />
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
