import React, { memo, useEffect, useState } from "react";
import {
  Cartesian3,
  Cartographic,
  Color,
  Math as M,
  Material,
  Ion,
  ScreenSpaceEventType,
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
  CustomDataSource,
  CzmlDataSource,
  GeoJsonDataSource,
} from "resium";
import { motion } from "framer-motion";
import { h3ToGeoBoundary } from "h3-js";
import styles from "../../App.module.css";
import { MenuContent } from "../MenuContent";
import { SideBar } from "../SideBar";
import { ModalContent } from "../ModalContent";
import { ConfirmModal } from "../ConfirmModal";
import { ControlledRender, controller } from "../../utils/hooks";

import { FaPen } from "react-icons/fa";
import { OwnedPolygon } from "../../utils/types";
import { isMobile } from "../../utils/isMobile";

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
      {ControlledRender(props.polygons, PLine)}
    </PolylineCollection>
  );
});
const PLine = memo(({ item }: { item: string }) => {
  return (
    <Polyline
      material={Material.fromType("Color", {
        color: Color.WHITE.withAlpha(0.2),
      })}
      positions={fromDegreesArray(getBoundary(item))}
      width={1}
    />
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
      />
    </Entity>
  );
});
const OwnedPolygons = memo(
  function Polyg(props: { geo: any; hexagons: OwnedPolygon[] }) {
    return (
      <GeoJsonDataSource
        data={{
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              geometry: {
                type: "MultiPolygon",
                coordinates: props.geo,
              },
            },
          ],
        }}
      />
    );
  },
  (prev, next) => prev.hexagons.length === next.hexagons.length
);

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
    altitude,
    setMobileSelection,
    mobileSelection,
    mobileSelectionFinish,
    mobile,
  } = controller();
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
        <OwnedPolygons
          hexagons={ownedPolygons.hexagons}
          geo={ownedPolygons.geo}
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
            action={mobileSelectionFinish}
            type={ScreenSpaceEventType.LEFT_UP}
          />
        </ScreenSpaceEventHandler>
        <ScreenSpaceCameraController
          enableTilt={false}
          enableRotate={!mobileSelection}
        />
        <Camera
          percentageChanged={0.1}
          onChange={() => onCameraChange()}
        ></Camera>
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
        <ConfirmModal setModal={setConfirmModal} modal={confirmModal} />
      </motion.div>
      {mobile && altitude < 1500 && (
        <button
          className="cesium-button cesium-toolbar-button cesium-home-button"
          style={{ float: "right", marginTop: "50px", marginRight: "8px" }}
          onClick={() => {
            if (areaSelection.length || selectedPolygons.length) {
              setModal(true);
            }
            setMobileSelection(!mobileSelection);
          }}
        >
          <FaPen />
        </button>
      )}
    </div>
  );
};
