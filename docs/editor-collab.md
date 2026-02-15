# Editor and Realtime Collaboration

## Canvas Engine Choice
- **Konva + react-konva** for deterministic node graph, layers, and performance.
- Konva supports hit testing, transforms, grouping, and export to data URLs.

## CRDT Stack
- **Yjs** for conflict-free document state.
- **y-websocket** server hosted in `apps/realtime`.
- Presence/awareness stored in Redis; periodic snapshotting to Postgres/S3.

## Scene Graph Schema (Canonical JSON)
The editor stores a stable, versioned scene graph independent of the runtime engine.

```
{
  "version": 1,
  "canvas": { "width": 1440, "height": 900, "background": "#ffffff" },
  "assets": {
    "images": { "img_1": { "url": "s3://...", "width": 1200, "height": 800 } },
    "fonts": { "font_1": { "family": "CustomFont", "url": "s3://..." } }
  },
  "nodes": [
    {
      "id": "node_1",
      "type": "group",
      "name": "HeroGroup",
      "parentId": null,
      "position": { "x": 120, "y": 80 },
      "size": { "w": 600, "h": 400 },
      "rotation": 0,
      "zIndex": 1,
      "locked": false,
      "visible": true,
      "children": ["node_2", "node_3"]
    },
    {
      "id": "node_2",
      "type": "text",
      "parentId": "node_1",
      "position": { "x": 0, "y": 0 },
      "size": { "w": 600, "h": 80 },
      "style": { "fontFamily": "font_1", "fontSize": 48, "color": "#111111", "align": "center" },
      "props": { "text": "You're Invited" }
    },
    {
      "id": "node_3",
      "type": "image",
      "parentId": "node_1",
      "position": { "x": 40, "y": 120 },
      "size": { "w": 520, "h": 240 },
      "props": { "assetId": "img_1", "crop": { "x": 0, "y": 0, "w": 520, "h": 240 } }
    }
  ],
  "components": [
    {
      "id": "cmp_rsvp_1",
      "type": "RSVP",
      "position": { "x": 120, "y": 520 },
      "size": { "w": 600, "h": 320 },
      "props": { "formId": "form_1", "theme": "default" }
    }
  ]
}
```

## Realtime Update Flow
1. Client edits update the Yjs document.
2. Realtime server broadcasts CRDT updates.
3. Periodic snapshots are stored to `site_versions.scene_graph`.
4. Server compacts update logs on a schedule.

