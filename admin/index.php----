<?php
header("Content-Security-Policy: frame-ancestors https://*.myshopify.com https://admin.shopify.com");
header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
header("Pragma: no-cache");
header("Expires: 0");

if (isset($_GET['action'])) header('Content-Type: application/json');
require '../connect.php';
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(["success" => false, "error" => "DB Connection failed: " . $conn->connect_error]);
    exit;
}

if (isset($_GET['action'])) {
    $action = $_GET['action'];
    function fetch_all_assoc($res) {
        return $res ? $res->fetch_all(MYSQLI_ASSOC) : [];
    }
    if ($action === 'get_tabs') {
        $res = $conn->query("SELECT * FROM tabs ORDER BY order_index ASC");
        echo json_encode(fetch_all_assoc($res));
        exit;
    }
    if ($action === 'get_subtabs' && isset($_GET['tab_id'])) {
        $tab_id = (int)$_GET['tab_id'];
        $stmt = $conn->prepare("SELECT * FROM subtabs WHERE tab_id = ? ORDER BY order_index ASC");
        $stmt->bind_param("i", $tab_id); $stmt->execute();
        echo json_encode(fetch_all_assoc($stmt->get_result())); exit;
    }
    if ($action === 'get_options') {
        $options = [];
        if (isset($_GET['tab_id'])) {
            $tab_id = (int)$_GET['tab_id'];
            $stmt = $conn->prepare("SELECT * FROM tab_options WHERE tab_id = ?");
            $stmt->bind_param("i", $tab_id); $stmt->execute();
            $options = fetch_all_assoc($stmt->get_result());
        } else if (isset($_GET['subtab_id'])) {
            $subtab_id = (int)$_GET['subtab_id'];
            $stmt = $conn->prepare("SELECT * FROM tab_options WHERE subtab_id = ?");
            $stmt->bind_param("i", $subtab_id); $stmt->execute();
            $options = fetch_all_assoc($stmt->get_result());
        }
        echo json_encode($options); exit;
    }
    if ($action === 'create_tab') {
        $data = json_decode(file_get_contents("php://input"), true);
        $name = trim($data['name'] ?? '');
        $order = (int)($data['order_index'] ?? 0);
        if ($name === '' || $order <= 0) {
            echo json_encode(["success" => false, "error" => "Missing name or invalid order"]); exit;
        }
        $stmt = $conn->prepare("INSERT INTO tabs (name, order_index) VALUES (?, ?)");
        if (!$stmt) { echo json_encode(["success" => false, "error" => $conn->error]); exit; }
        $stmt->bind_param("si", $name, $order);
        echo $stmt->execute()
            ? json_encode(["success" => true, "id" => $stmt->insert_id])
            : json_encode(["success" => false, "error" => $stmt->error]);
        exit;
    }
    if ($action === 'create_subtab') {
        $data = json_decode(file_get_contents("php://input"), true);
        $tab_id = (int)($data['tab_id'] ?? 0);
        $name = trim($data['name'] ?? '');
        $order = (int)($data['order_index'] ?? 0);
        if ($tab_id <= 0 || $name === '' || $order <= 0) {
            echo json_encode(["success" => false, "error" => "Missing tab_id, name or invalid order"]); exit;
        }
        $stmt = $conn->prepare("INSERT INTO subtabs (tab_id, name, order_index) VALUES (?, ?, ?)");
        if (!$stmt) { echo json_encode(["success" => false, "error" => $conn->error]); exit; }
        $stmt->bind_param("isi", $tab_id, $name, $order);
        echo $stmt->execute()
            ? json_encode(["success" => true, "id" => $stmt->insert_id])
            : json_encode(["success" => false, "error" => $stmt->error]);
        exit;
    }
    if ($action === 'create_option') {
        $data = json_decode(file_get_contents("php://input"), true);
        $isTab = !empty($data['tab_id']) && empty($data['subtab_id']);
        $isSubtab = !empty($data['subtab_id']);
        $tab_id = $isTab ? (int)$data['tab_id'] : null;
        $subtab_id = $isSubtab ? (int)$data['subtab_id'] : null;
        $label = trim($data['label'] ?? '');
        $value_key = trim($data['value_key'] ?? '');
        $image_url = trim($data['image_url'] ?? '');
        $price = (float)($data['price'] ?? 0);
        $extra_json = $data['extra_json'] ?? '{}';
        $extra_obj = json_decode($extra_json, true);
        $hasHeadingSubheading = isset($extra_obj['heading']) && $extra_obj['heading'] !== '';
        if ((!$tab_id && !$subtab_id) || ($tab_id && $subtab_id)) { echo json_encode(["success"=>false,"error"=>"Select main tab OR subtab only"]); exit;}
        if ($label === '' && !$hasHeadingSubheading) { echo json_encode(["success" => false, "error" => "Missing label or heading"]); exit; }
        if ($label === '' && $hasHeadingSubheading) $label = $extra_obj['heading'];
        $stmt = $conn->prepare("INSERT INTO tab_options (tab_id, subtab_id, label, value_key, image_url, price, extra_json) VALUES (?, ?, ?, ?, ?, ?, ?)");
        if (!$stmt) { echo json_encode(["success" => false, "error" => $conn->error]); exit; }
        $stmt->bind_param("iisssds", $tab_id, $subtab_id, $label, $value_key, $image_url, $price, $extra_json);
        if ($stmt->execute()) {
            $option_id = $stmt->insert_id;

            // Height/Width Save
            if (isset($extra_obj['combo_option_ids']) && isset($extra_obj['height_width_rows'])) {
                foreach ($extra_obj['height_width_rows'] as $row) {
                    $combo_json = json_encode($extra_obj['combo_option_ids']);
                    $height = $row['height'] ?? '';
                    $width  = $row['width'] ?? '';
                    $p = isset($row['price']) ? floatval($row['price']) : 0.0;
                    $stmt2 = $conn->prepare("INSERT INTO height_width_prices (option_parent_id, combo_option_ids, height, width, price) VALUES (?, ?, ?, ?, ?)");
                    $stmt2->bind_param("isssd", $option_id, $combo_json, $height, $width, $p);
                    $stmt2->execute();
                }
            }
            // Combo Option Save
            if (isset($extra_obj['combo_option_ids']) && isset($extra_obj['combo_rows'])) {
                foreach ($extra_obj['combo_rows'] as $row) {
                    $combo_json = json_encode($extra_obj['combo_option_ids']);
                    $heading = $row['heading'] ?? '';
                    $subheading = $row['subheading'] ?? '';
                    $image_url2 = $row['image_url'] ?? '';
                    $p = isset($row['price']) ? floatval($row['price']) : 0.0;
                    $stmt2 = $conn->prepare("INSERT INTO combo_options (option_parent_id, combo_option_ids, heading, subheading, image_url, price) VALUES (?, ?, ?, ?, ?, ?)");
                    $stmt2->bind_param("issssd", $option_id, $combo_json, $heading, $subheading, $image_url2, $p);
                    $stmt2->execute();
                }
            }

            echo json_encode(["success" => true, "id" => $option_id]);
        } else {
            echo json_encode(["success" => false, "error" => $stmt->error]);
        }
        exit;
    }

    // === NEW: update_option action to edit an existing option ===
    if ($action === 'update_option') {
        $data = json_decode(file_get_contents("php://input"), true);
        $id = (int)($data['id'] ?? 0);
        if (!$id) {
            echo json_encode(["success" => false, "error" => "Missing option id"]);
            exit;
        }
        $label = trim($data['label'] ?? '');
        $value_key = trim($data['value_key'] ?? '');
        $image_url = trim($data['image_url'] ?? '');
        $price = (float)($data['price'] ?? 0);
        $extra_json = $data['extra_json'] ?? '{}';

        $stmt = $conn->prepare("UPDATE tab_options SET label=?, value_key=?, image_url=?, price=?, extra_json=? WHERE id=?");
        if (!$stmt) {
            echo json_encode(["success" => false, "error" => $conn->error]);
            exit;
        }
        $stmt->bind_param("sssdsi", $label, $value_key, $image_url, $price, $extra_json, $id);
        if ($stmt->execute()) {
            echo json_encode(["success" => true]);
        } else {
            echo json_encode(["success" => false, "error" => $stmt->error]);
        }
        exit;
    }

    if ($action === 'delete_tab' && isset($_GET['id'])) {
        $id = (int)$_GET['id'];
        $conn->query("DELETE FROM tabs WHERE id = $id");
        echo json_encode(["success" => true]);
        exit;
    }
    if ($action === 'delete_subtab' && isset($_GET['id'])) {
        $id = (int)$_GET['id'];
        $conn->query("DELETE FROM subtabs WHERE id = $id");
        echo json_encode(["success" => true]);
        exit;
    }
    if ($action === 'delete_option' && isset($_GET['id'])) {
        $id = (int)$_GET['id'];
        $conn->query("DELETE FROM tab_options WHERE id = $id");
        $conn->query("DELETE FROM combo_options WHERE option_parent_id = $id");
        $conn->query("DELETE FROM height_width_prices WHERE option_parent_id = $id");
        echo json_encode(["success" => true]);
        exit;
    }
    http_response_code(400);
    echo json_encode(["success" => false, "error" => "Invalid action"]);
    exit;
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>Configurator Admin</title>
<meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
<meta http-equiv="Pragma" content="no-cache" />
<meta http-equiv="Expires" content="0" />
<script src="https://code.jquery.com/jquery-3.7.1.min.js"></script>
<link href="https://cdn.jsdelivr.net/npm/select2@4.1.0-rc.0/dist/css/select2.min.css" rel="stylesheet" />
<script src="https://cdn.jsdelivr.net/npm/select2@4.1.0-rc.0/dist/js/select2.min.js"></script>
<style>
td svg {
    width: 41px;
    height: auto;
}
body{font-family:sans-serif;max-width:1100px;margin:auto;padding:20px;}
h2,h3{margin-top:40px;}input,select,button,textarea{width:100%;padding:10px;margin:10px 0;box-sizing:border-box;}
.row{display:flex;gap:10px;}.row>*{flex:1;}
table{width:100%;border-collapse:collapse;margin-top:20px;}
th,td{border:1px solid #ccc;padding:8px;vertical-align:top;}
.delete{color:red;cursor:pointer;user-select:none;}
.edit { color: #0074d9; cursor: pointer; margin-right: 10px; user-select:none; }
thumb svg{height:40px;}
#listEditor{margin-top:10px;}
#listEditor label{font-weight:bold;margin-top:15px;display:block;}
.list-item{display:flex;align-items:center;margin-bottom:8px;}
.list-item input[type="text"]{flex-grow:1;padding:8px;font-size:14px;}
.list-item button{flex-shrink:0;margin-left:8px;padding:6px 12px;font-size:13px;cursor:pointer;background:#d9534f;color:white;border:none;border-radius:3px;width:10%;}
.list-item button:hover{background:#c9302c;}
#addListItemBtn{margin-top:10px;padding:8px 14px;font-size:14px;cursor:pointer;background:#0275d8;color:white;border:none;border-radius:3px;}
#addListItemBtn:hover{background:#025aa5;}
.extra-json-display{max-width:300px;font-size:14px;}
.extra-json-display ul{padding-left:18px;margin:0;}
.extra-json-display li{margin-bottom:4px;display:flex;align-items:center;}
.extra-json-display li img{height:14px;width:14px;margin-right:6px;}
#subtabSection{margin-top:40px;border:1px solid #ccc;padding:15px;border-radius:8px;background:#fafafa;}
#subtabSection h3{margin-top:0;}
#bottomSection{margin-top:40px;border:1px solid #ccc;padding:15px;border-radius:8px;background:#eef5fc;}
#bottomSection h2{margin-top:0;}
#bottomSection select{margin-bottom:15px;}
.select2-container { width:100%!important; }

/* Edit Modal */
#editOptionModal {
  display:none; 
  position:fixed; 
  top:0; left:0; 
  width:100vw; height:100vh; 
  background:rgba(0,0,0,0.4); 
  z-index:10000; 
  align-items:center; 
  justify-content:center;
}
#editOptionModal form { 
  max-width:420px; width:90vw; 
  background:#fff; 
  border-radius:10px; 
  box-shadow:0 4px 36px #0002; 
  padding:25px 25px 10px 25px; 
  position:relative;
}
#editOptionModal label{display:block;margin-bottom:2px;}
#editOptionModal input,#editOptionModal textarea{margin-bottom:8px;}
</style>
</head>
<body>

<h2>Create Tab</h2>
<form id="tabForm">
  <div class="row">
    <input type="text" id="tabName" placeholder="Tab Name" required />
    <input type="number" id="tabOrder" placeholder="Order Index" required min="1" />
    <button type="submit">Add Tab</button>
  </div>
</form>

<div id="subtabSection" style="display:none;">
  <h3>Manage Subtabs for Selected Tab</h3>
  <div class="row" style="margin-bottom:10px;">
    <select id="mainTabSelectForSubtab" style="flex: 3;"></select>
    <input type="text" id="subtabName" placeholder="Subtab Name" style="flex: 3;" />
    <input type="number" id="subtabOrder" placeholder="Subtab Order" min="1" style="flex: 1;" />
    <button id="addSubtabBtn" style="flex: 1;">Add Subtab</button>
  </div>
  <select id="subtabSelect" style="width:100%;margin-bottom:20px;"></select>
</div>

<h2>Add Option to Tab / Subtab</h2>
<form id="optionForm">
  <div class="row">
    <select id="tabSubtabSelect"></select>
    <input type="text" id="label" placeholder="Label (or leave blank if using Heading/Subheading)" />
    <input type="text" id="valueKey" placeholder="Value Key" />
  </div>
  <div class="row">
    <input type="text" id="imageURL" placeholder="Image URL" />
    <input type="number" step="0.01" id="price" placeholder="Price" />
  </div>
  <div>
    <label for="optionTypeSelect">Option Type</label>
    <select id="optionTypeSelect" style="width:100%;padding:8px;margin-bottom:15px;">
      <option value="listing" selected>Listing</option>
      <option value="headingSubheading">Heading & Subheading</option>
      <option value="heightWidthTab">Height/Width Tab</option>
      <option value="comboOption">Combination Option</option>
    </select>
  </div>
  <div id="listEditor">
    <label for="checkmarkUrl" style="display:none">Checkmark Image URL</label>
    <input type="text" id="checkmarkUrl" placeholder="Enter checkmark image URL" value="https://droplify.de/deine-fenster24/frontend/checkmark.svg" style="display:none" />
    <label>List Items</label>
    <div id="listItemsContainer"></div>
    <button type="button" id="addListItemBtn">Add List Item</button>
  </div>
  <div id="headingSubheadingEditor" style="display:none;">
    <label>Heading</label>
    <input type="text" id="headingInput" placeholder="Heading (leave Label blank if used)" />
    <label>Subheading</label>
    <input type="text" id="subheadingInput" placeholder="Subheading" />
  </div>
  <div id="heightWidthTabEditor" style="display:none;">
    <label for="optionMultiSelect"><b>Select Any Combination of Options (from any tab or subtab):</b></label>
    <select id="optionMultiSelect" multiple="multiple"></select>
    <span id="currentComboText" style="margin-left:10px;font-weight:bold;display:block;"></span>
    <div style="margin:10px 0;">
      <table id="heightWidthRowsTable" style="width:100%;border-collapse:collapse;margin:10px 0;">
        <thead>
          <tr>
            <th style="width:30%;">Height</th>
            <th style="width:30%;">Width</th>
            <th style="width:30%;">Price</th>
            <th style="width:10%;">Action</th>
          </tr>
        </thead>
        <tbody>
        </tbody>
      </table>
      <button type="button" id="addHeightWidthRowBtn">Add Row</button>
    </div>
  </div>
  <div id="comboOptionEditor" style="display:none;">
    <label><b>Select Any Combination of Options (from any tab or subtab):</b></label>
    <select id="comboOptionMultiSelect" multiple="multiple"></select>
    <span id="comboCurrentComboText" style="margin-left:10px;font-weight:bold;display:block;"></span>
    <div id="comboRowsTableContainer" style="margin:10px 0;">
      <table id="comboRowsTable" style="width:100%;border-collapse:collapse;margin:10px 0;">
        <thead>
          <tr>
<th style="width:17%;">Option</th>
            <th style="width:22%;">Heading</th>
            <th style="width:22%;">Subheading</th>
            <th style="width:22%;">Image URL</th>
            <th style="width:17%;">Price</th>
            <th style="width:17%;">Action</th>
          </tr>
        </thead>
        <tbody></tbody>
      </table>
      <button type="button" id="addComboRowBtn">Add Row</button>
    </div>
  </div>
  <input type="hidden" id="extraJson" name="extra_json" value="{}" />
  <button type="submit" style="margin-top:15px;">Add Option</button>
</form>

<h2>Tabs</h2>
<table id="tabsTable">
  <thead><tr><th>ID</th><th>Name</th><th>Order</th><th>Action</th></tr></thead>
  <tbody></tbody>
</table>

<div id="bottomSection">
  <h2>Options by Main Tab and Subtabs</h2>
  <label for="bottomMainTabSelect">Main Tab</label>
  <select id="bottomMainTabSelect" title="Select Main Tab"></select>
  <label for="bottomSubtabSelect">Subtabs (Select to filter)</label>
  <select id="bottomSubtabSelect" title="Select Subtab">
    <option value="">-- Select Subtab (All subtabs options shown by default) --</option>
  </select>
  <table id="optionsTable">
    <thead>
      <tr><th>ID</th><th>Label</th><th>Value</th><th>Price</th><th>Image</th><th>Extra JSON</th><th>Action</th></tr>
    </thead>
    <tbody></tbody>
  </table>
</div>

<!-- EDIT OPTION MODAL -->
<div id="editOptionModal">
  <form id="editOptionForm" autocomplete="off" onsubmit="return false;">
    <input type="hidden" id="editOptionId" />
    <label>Label</label>
    <input type="text" id="editLabel" />
    <label>Value Key</label>
    <input type="text" id="editValueKey" />
    <label>Image URL</label>
    <input type="text" id="editImageUrl" />
    <label>Price</label>
    <input type="number" step="0.01" id="editPrice" />
    <label>Extra JSON</label>
    <textarea id="editExtraJson" style="height:80px;font-size:13px;"></textarea>
    <div style="text-align:right;margin-top:10px;">
      <button type="button" onclick="closeEditModal()" style="margin-right:12px;">Cancel</button>
      <button type="submit" id="editOptionSaveBtn">Save</button>
    </div>
  </form>
</div>

<script>
const STATIC_MAIN_TABS = [
  { id: "__static_ksf__", label: "Kunststofffenster", shortcode: "Kunststofffenster" },
  { id: "__static_schiebe__", label: "Schiebetüren", shortcode: "Schiebetüren" },
  { id: "__static_balkon__", label: "Balkonfenster", shortcode: "Balkonfenster" }
];
const api = window.location.origin + window.location.pathname;
const $ = sel => document.querySelector(sel), $$ = sel => document.querySelectorAll(sel);
const listItemsContainer = $('#listItemsContainer'), addListItemBtn = $('#addListItemBtn'),
      checkmarkUrlInput = $('#checkmarkUrl'), extraJsonInput = $('#extraJson'),
      optionTypeSelect = $('#optionTypeSelect'), listEditor = $('#listEditor'), headingSubheadingEditor = $('#headingSubheadingEditor'),
      mainTabSelectForSubtab = $('#mainTabSelectForSubtab'), subtabSection = $('#subtabSection'), subtabSelect = $('#subtabSelect'),
      tabSubtabSelect = $('#tabSubtabSelect'), tabsTableBody = $('#tabsTable tbody'),
      bottomMainTabSelect = $('#bottomMainTabSelect'), bottomSubtabSelect = $('#bottomSubtabSelect'), optionsTableBody = $('#optionsTable tbody');

let currentTargetTabId = null, currentTargetSubtabId = null, TABS = [], SUBTABS = {}, TAB_OPTIONS = {};
let loadedTabs = false;

// --- List Items (Listing Option) ---
function createListItem(value = '') {
  const div = document.createElement('div');
  div.className = 'list-item';
  div.innerHTML = `<input type="text" value="${value}" placeholder="List item text"><button type="button">Remove</button>`;
  div.querySelector('button').onclick = () => div.remove();
  return div;
}
function resetListEditor() {
  listItemsContainer.innerHTML = '';
  listItemsContainer.appendChild(createListItem());
  checkmarkUrlInput.value = "https://droplify.de/deine-fenster24/frontend/checkmark.svg";
}
resetListEditor();
addListItemBtn.onclick = () => listItemsContainer.appendChild(createListItem());

// --- Option Type Show/Hide ---
optionTypeSelect.onchange = function() {
  listEditor.style.display = optionTypeSelect.value === 'listing' ? 'block' : 'none';
  headingSubheadingEditor.style.display = optionTypeSelect.value === 'headingSubheading' ? 'block' : 'none';
  document.getElementById('heightWidthTabEditor').style.display = optionTypeSelect.value === 'heightWidthTab' ? 'block' : 'none';
  document.getElementById('comboOptionEditor').style.display = optionTypeSelect.value === 'comboOption' ? 'block' : 'none';
  if (optionTypeSelect.value === 'heightWidthTab' && loadedTabs) {
    populateOptionMultiSelect();
    clearHeightWidthRows();
    addHeightWidthRow();
  }
  if (optionTypeSelect.value === 'comboOption' && loadedTabs) {
    populateComboOptionMultiSelect();
    clearComboRows();
    addComboRow();
  }
};
optionTypeSelect.dispatchEvent(new Event('change'));

async function fetchAPI(url, opts) { return fetch(url, opts).then(r => r.json()); }
async function fetchTabs() {
  TABS = await fetchAPI(api + '?action=get_tabs');
  SUBTABS = {};
  TAB_OPTIONS = {};
  for (const tab of TABS) {
    SUBTABS[tab.id] = await fetchAPI(api + `?action=get_subtabs&tab_id=${tab.id}`);
    TAB_OPTIONS[tab.id] = await fetchAPI(api + `?action=get_options&tab_id=${tab.id}`);
    for (const sub of SUBTABS[tab.id]) {
      TAB_OPTIONS['sub_' + sub.id] = await fetchAPI(api + `?action=get_options&subtab_id=${sub.id}`);
    }
  }
  loadedTabs = true;
  await fillTabsUI();
}
async function fillTabsUI() {
  mainTabSelectForSubtab.innerHTML = ''; bottomMainTabSelect.innerHTML = '';
  bottomSubtabSelect.innerHTML = '<option value="">-- Select Subtab (All subtabs options shown by default) --</option>';
  tabSubtabSelect.innerHTML = ''; tabsTableBody.innerHTML = '';
  if (!TABS.length) {
    subtabSection.style.display = 'none';
    tabsTableBody.innerHTML = '<tr><td colspan="4">No tabs found.</td></tr>';
    optionsTableBody.innerHTML = '<tr><td colspan="7">No tabs found.</td></tr>';
    currentTargetTabId = null; currentTargetSubtabId = null;
    updateAddOptionButtonState();
    return;
  }
  subtabSection.style.display = 'block';
  for (const tab of TABS) {
    mainTabSelectForSubtab.innerHTML += `<option value="${tab.id}">${tab.name}</option>`;
    bottomMainTabSelect.innerHTML += `<option value="${tab.id}">${tab.name}</option>`;
  }
  tabSubtabSelect.innerHTML = '';
  for (const tab of TABS) {
    tabSubtabSelect.innerHTML += `<option value="tab_${tab.id}">${tab.name}</option>`;
    (SUBTABS[tab.id]||[]).forEach(st => {
      tabSubtabSelect.innerHTML += `<option value="subtab_${st.id}">&nbsp;&nbsp;&nbsp;↳ ${st.name}</option>`;
    });
  }
  tabSubtabSelect.onchange = function() {
    const val = tabSubtabSelect.value;
    if (val.startsWith('tab_')) {
      currentTargetTabId = parseInt(val.replace('tab_','')); currentTargetSubtabId = null;
    } else if (val.startsWith('subtab_')) {
      currentTargetTabId = null; currentTargetSubtabId = parseInt(val.replace('subtab_',''));
    } else { currentTargetTabId = null; currentTargetSubtabId = null; }
    updateAddOptionButtonState();
  };
  tabSubtabSelect.value = tabSubtabSelect.options.length ? tabSubtabSelect.options[0].value : '';
  tabSubtabSelect.onchange();
  for (const tab of TABS) {
    tabsTableBody.innerHTML += `<tr>
      <td>${tab.id}</td><td>${tab.name}</td><td>${tab.order_index}</td>
      <td><span class="delete" onclick="deleteTab(${tab.id})">Delete</span></td>
    </tr>`;
  }
  if (TABS.length) {
    bottomMainTabSelect.value = TABS[0].id;
    mainTabSelectForSubtab.value = TABS[0].id;
    await loadSubtabsForMainTab(TABS[0].id);
    await handleBottomMainTabChange();
  }
  updateAddOptionButtonState();
}

async function fetchOptions(tabOrSubtab) {
  if (tabOrSubtab.type === 'tab') return TAB_OPTIONS[tabOrSubtab.id] || [];
  if (tabOrSubtab.type === 'subtab') return TAB_OPTIONS['sub_' + tabOrSubtab.id] || [];
  return [];
}

function renderImgSmart(url, cls='', style='') {
  if (!url) return '';
  url = url.trim();
  if (url.startsWith('<svg')) return url;
  return `<img${cls ? ` class="${cls}"` : ''}${style ? ` style="${style}"` : ''} src="${url}">`;
}
function renderOptionsTable(options) {
  optionsTableBody.innerHTML = options.length ? options.map(o => {
    let extraObj = {};
    try { extraObj = JSON.parse(o.extra_json || '{}'); } catch(e){}
    let extraHtml = '<div class="extra-json-display">';
    if (extraObj.subheading) extraHtml += `<p><strong>Subheading:</strong> ${extraObj.subheading}</p>`;
    if (extraObj.items && Array.isArray(extraObj.items)) {
      extraHtml += '<ul>';
      const checkmarkSrc = extraObj.checkmark_image_url || 'https://droplify.de/deine-fenster24/frontend/checkmark.svg';
      extraObj.items.forEach(item => { extraHtml += `<li><img src="${checkmarkSrc}" alt="checkmark">${item}</li>`; });
      extraHtml += '</ul>';
    }
    // Height/Width Table
    if (extraObj.combo_option_ids && extraObj.height_width_rows) {
      extraHtml += `<div><strong>Option Combo:</strong> ${Array.isArray(extraObj.combo_option_ids) ? extraObj.combo_option_ids.join(' > ') : ''}</div>`;
      if (Array.isArray(extraObj.height_width_rows)) {
        extraHtml += '<table style="margin-top:5px;font-size:12px;border:1px solid #ccc;"><tr><th>Height</th><th>Width</th><th>Price</th></tr>';
        extraObj.height_width_rows.forEach(row=>{
          extraHtml += `<tr><td>${row.height||''}</td><td>${row.width||''}</td><td>${row.price||''}</td></tr>`;
        });
        extraHtml += '</table>';
      }
    }
    // Combo Option Table
    if (extraObj.combo_option_ids && extraObj.combo_rows) {
      extraHtml += '<div><strong>Option Combo:</strong> ' + (Array.isArray(extraObj.combo_option_ids) ? extraObj.combo_option_ids.join(' > ') : '') + '</div>';
      if (Array.isArray(extraObj.combo_rows)) {
        extraHtml += '<table style="margin-top:5px;font-size:12px;border:1px solid #ccc;"><tr><th>Heading</th><th>Subheading</th><th>Image</th><th>Price</th></tr>';
        extraObj.combo_rows.forEach(row => {
          extraHtml += `<tr>
            <td>${row.heading||''}</td>
            <td>${row.subheading||''}</td>
            <td>${renderImgSmart(row.image_url, '', 'height:30px;')}</td>
            <td>${row.price||''}</td>
          </tr>`;
        });
        extraHtml += '</table>';
      }
    }
    extraHtml += '</div>';
    return `<tr>
      <td>${o.id}</td>
      <td>${o.label}</td>
      <td>${o.value_key}</td>
      <td>${o.price}</td>
      <td>${renderImgSmart(o.image_url, 'thumb')}</td>
      <td>${extraHtml}</td>
      <td>
        <span class='edit' onclick='editOption(${JSON.stringify(o).replace(/'/g,"&#39;")})'>Edit</span>
        <span class='delete' onclick='deleteOption(${o.id})'>Delete</span>
      </td>
    </tr>`;
  }).join('') : '<tr><td colspan="7" style="text-align:center; font-style:italic;">No options found.</td></tr>';
}

$('#addSubtabBtn').onclick = async (e) => {
  e.preventDefault();
  const tabId = parseInt(mainTabSelectForSubtab.value), name = $('#subtabName').value.trim(),
        order = parseInt($('#subtabOrder').value);
  if (!tabId) return alert('Please select a main tab to add a subtab.');
  if (!name) return alert('Please enter a subtab name.');
  if (!order || order < 1) return alert('Please enter a valid subtab order (1 or greater).');
  const result = await fetchAPI(api + '?action=create_subtab', {
    method: 'POST', headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({ tab_id: tabId, name, order_index: order })
  });
  if (!result.success) return alert('Failed to add subtab: ' + result.error);
  $('#subtabName').value = ''; $('#subtabOrder').value = '';
  await loadSubtabsForMainTab(tabId);
  await fetchTabs();
};

async function loadSubtabsForMainTab(tabId) {
  const subtabs = SUBTABS[tabId]||[];
  subtabSelect.innerHTML = subtabs.length
    ? subtabs.map(st => `<option value="${st.id}">${st.name}</option>`).join('')
    : '<option disabled>No subtabs found for this tab.</option>';
}
mainTabSelectForSubtab.onchange = async () => {
  const selectedTabId = parseInt(mainTabSelectForSubtab.value);
  selectedTabId ? await loadSubtabsForMainTab(selectedTabId) : subtabSelect.innerHTML = '';
};

async function handleBottomMainTabChange() {
  const mainTabId = parseInt(bottomMainTabSelect.value);
  if (!mainTabId) {
    optionsTableBody.innerHTML = '<tr><td colspan="7" style="text-align:center; font-style:italic;">No options available.</td></tr>';
    bottomSubtabSelect.innerHTML = '<option value="">-- Select Subtab (All subtabs options shown by default) --</option>';
    bottomSubtabSelect.style.display = 'inline-block';
    currentTargetTabId = null; currentTargetSubtabId = null;
    updateAddOptionButtonState();
    return;
  }
  const subtabs = SUBTABS[mainTabId]||[];
  bottomSubtabSelect.innerHTML = '<option value="">-- Select Subtab (All subtabs options shown by default) --</option>' +
    subtabs.map(st => `<option value="${st.id}">${st.name}</option>`).join('');
  bottomSubtabSelect.style.display = subtabs.length ? 'inline-block' : 'none';
  const mainOptions = await fetchOptions({type:'tab', id:mainTabId});
  let allOptions = [...mainOptions];
  for (const st of subtabs) allOptions = allOptions.concat(await fetchOptions({type:'subtab',id:st.id}));
  renderOptionsTable(allOptions);
  currentTargetTabId = mainTabId; currentTargetSubtabId = null;
  updateAddOptionButtonState();
}
bottomMainTabSelect.onchange = handleBottomMainTabChange;
bottomSubtabSelect.onchange = async () => {
  const selectedSubtabId = bottomSubtabSelect.value, mainTabId = parseInt(bottomMainTabSelect.value);
  if (!mainTabId) {
    optionsTableBody.innerHTML = '<tr><td colspan="7" style="text-align:center; font-style:italic;">No options available.</td></tr>';
    currentTargetTabId = null; currentTargetSubtabId = null;
    updateAddOptionButtonState();
    return;
  }
  if (!selectedSubtabId) await handleBottomMainTabChange();
  else {
    const subtabOptions = await fetchOptions({type:'subtab',id:parseInt(selectedSubtabId)});
    renderOptionsTable(subtabOptions);
    currentTargetTabId = null; currentTargetSubtabId = parseInt(selectedSubtabId);
  }
  updateAddOptionButtonState();
};

$('#tabForm').onsubmit = async e => {
  e.preventDefault();
  const name = $('#tabName').value.trim(), order = $('#tabOrder').value;
  const result = await fetchAPI(api + '?action=create_tab', {
    method: 'POST', headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({ name, order_index: order })
  });
  if (!result.success) return alert('Failed to add tab: ' + result.error);
  e.target.reset(); await fetchTabs();
};

// -------- Height/Width Pricing Rows Logic --------
function makeHeightWidthRow(height = '', width = '', price = '') {
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td><input type="text" class="hw-height" value="${height}" placeholder="Height" style="width:100%;"></td>
    <td><input type="text" class="hw-width" value="${width}" placeholder="Width" style="width:100%;"></td>
    <td><input type="number" class="hw-price" value="${price}" placeholder="Price" style="width:100%;" step="0.01"></td>
    <td><button type="button" class="hw-remove-btn" style="background:#d9534f;color:white;border:none;padding:6px 12px;border-radius:3px;cursor:pointer;">Remove</button></td>
  `;
  tr.querySelector('.hw-remove-btn').onclick = () => tr.remove();
  return tr;
}
function addHeightWidthRow(height='', width='', price='') {
  $('#heightWidthRowsTable tbody').appendChild(makeHeightWidthRow(height, width, price));
}
$('#addHeightWidthRowBtn').onclick = () => addHeightWidthRow();
function clearHeightWidthRows() {
  $('#heightWidthRowsTable tbody').innerHTML = '';
}
function getHeightWidthRows() {
  return Array.from($('#heightWidthRowsTable tbody').querySelectorAll('tr')).map(tr => {
    return {
      height: tr.querySelector('.hw-height').value.trim(),
      width: tr.querySelector('.hw-width').value.trim(),
      price: tr.querySelector('.hw-price').value.trim()
    };
  }).filter(row => row.height || row.width || row.price);
}
// -------- END Height/Width Pricing Rows Logic --------

// -------- Combo Option Rows Logic --------
function makeComboRow(option_id = '', heading = '', subheading = '', image_url = '', price = '') {
  let allOptions = [];
  Object.values(TAB_OPTIONS).forEach(optionArr => {
    (optionArr || []).forEach(opt => allOptions.push(opt));
  });
  let optionSelect = '<select class="combo-option-id">';
  allOptions.forEach(opt => {
    optionSelect += `<option value="${opt.id}" ${opt.id == option_id ? 'selected' : ''}>${opt.label}</option>`;
  });
  optionSelect += '</select>';

  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td>${optionSelect}</td>
    <td><input type="text" class="combo-heading" value="${heading}" placeholder="Heading" style="width:100%;"></td>
    <td><input type="text" class="combo-subheading" value="${subheading}" placeholder="Subheading" style="width:100%;"></td>
    <td><input type="text" class="combo-image-url" value="${image_url}" placeholder="Image URL" style="width:100%;"></td>
    <td><input type="number" class="combo-price" value="${price}" placeholder="Price" style="width:100%;" step="0.01"></td>
    <td><button type="button" class="combo-remove-btn" style="background:#d9534f;color:white;border:none;padding:6px 12px;border-radius:3px;cursor:pointer;">Remove</button></td>
  `;
  tr.querySelector('.combo-remove-btn').onclick = () => tr.remove();
  tr.querySelector('.combo-option-id').addEventListener('change', function() {
    let optId = this.value;
    let optObj = allOptions.find(o => o.id == optId);
    if (optObj) {
      tr.querySelector('.combo-heading').value = optObj.label || '';
      tr.querySelector('.combo-image-url').value = optObj.image_url || '';
    }
  });
  return tr;
}

function addComboRow(option_id = '', heading = '', subheading = '', image_url = '', price = '') {
  $('#comboRowsTable tbody').appendChild(makeComboRow(option_id, heading, subheading, image_url, price));
}

$('#addComboRowBtn').onclick = () => addComboRow();
function clearComboRows() { $('#comboRowsTable tbody').innerHTML = ''; }
function getComboRows() {
  return Array.from($('#comboRowsTable tbody').querySelectorAll('tr')).map(tr => ({
    option_id: tr.querySelector('.combo-option-id').value.trim(),
    heading: tr.querySelector('.combo-heading').value.trim(),
    subheading: tr.querySelector('.combo-subheading').value.trim(),
    image_url: tr.querySelector('.combo-image-url').value.trim(),
    price: tr.querySelector('.combo-price').value.trim()
  })).filter(row => row.heading || row.subheading || row.image_url || row.price);
}
// -------- END Combo Option Rows Logic --------

$('#optionForm').onsubmit = async e => {
  e.preventDefault();
  if (!(currentTargetTabId || currentTargetSubtabId)) return alert('Please select a tab or subtab to add the option.');
  const labelInput = $('#label').value.trim(), optionType = optionTypeSelect.value;
  let extraJsonObj = {}, label = labelInput;

  if (optionType === 'headingSubheading') {
    const headingInput = $('#headingInput').value.trim(), subheadingInput = $('#subheadingInput').value.trim();
    if (headingInput === '') return alert('Heading is required for Heading & Subheading option');
    label = ''; extraJsonObj.heading = headingInput; extraJsonObj.subheading = subheadingInput;
  } else if (optionType === 'listing') {
    const items = Array.from(listItemsContainer.querySelectorAll('input[type=text]')).map(input => input.value.trim()).filter(v => v.length);
    if (label === '') return alert('Label is required for Listing option');
    extraJsonObj.items = items;
    extraJsonObj.checkmark_image_url = checkmarkUrlInput.value.trim() || "https://droplify.de/deine-fenster24/frontend/checkmark.svg";
  } else if (optionType === 'heightWidthTab') {
    var $select = window.jQuery('#optionMultiSelect');
    const selectedIds = $select.val();
    if (!selectedIds || selectedIds.length < 1) return alert('Select at least one option for the combination!');
    const hwRows = getHeightWidthRows();
    if (hwRows.length === 0) return alert('Add at least one width/height/price row!');
    extraJsonObj.combo_option_ids = selectedIds;
    extraJsonObj.height_width_rows = hwRows;
    if (label === '') label = 'HW Combo: ' + selectedIds.join(' > ');
  } else if (optionType === 'comboOption') {
    var $select = window.jQuery('#comboOptionMultiSelect');
    const selectedIds = $select.val();
    if (!selectedIds || selectedIds.length < 1) return alert('Select at least one option for the combination!');
    const comboRows = getComboRows();
    if (comboRows.length === 0) return alert('Add at least one row!');
    extraJsonObj.combo_option_ids = selectedIds;
    extraJsonObj.combo_rows = comboRows;
    if (label === '') label = 'Combo: ' + selectedIds.join(' > ');
  }
  extraJsonInput.value = JSON.stringify(extraJsonObj);
  const data = {
    tab_id: currentTargetTabId,
    subtab_id: currentTargetSubtabId,
    label,
    value_key: $('#valueKey').value.trim(),
    image_url: $('#imageURL').value.trim(),
    price: $('#price').value,
    extra_json: extraJsonInput.value
  };
  const result = await fetchAPI(api + '?action=create_option', {
    method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data)
  });
  if (!result.success) return alert('Failed to add option: ' + result.error);
  e.target.reset(); resetListEditor(); clearHeightWidthRows(); clearComboRows(); optionTypeSelect.value = 'listing'; optionTypeSelect.dispatchEvent(new Event('change'));
  await fetchTabs();
};

window.deleteTab = async id => {
  if (!confirm('Delete this tab? All related subtabs and options will also be deleted.')) return;
  await fetchAPI(api + `?action=delete_tab&id=${id}`); await fetchTabs();
};
window.deleteSubtab = async (id) => {
  if (!confirm('Delete this subtab? All related options will also be deleted.')) return;
  await fetchAPI(api + `?action=delete_subtab&id=${id}`); await fetchTabs();
};
window.deleteOption = async (id) => {
  if (!confirm('Delete this option?')) return;
  await fetchAPI(api + `?action=delete_option&id=${id}`); await fetchTabs();
};

function updateAddOptionButtonState() {
  $('#optionForm button[type=submit]').disabled = !(currentTargetTabId || currentTargetSubtabId);
}

// ---- Select2 Combo Dropdown for Height/Width Tab ----
function populateOptionMultiSelect() {
  var $select = window.jQuery('#optionMultiSelect');
  if ($select.data('select2')) $select.select2('destroy');
  $select.empty();

  // --- STATIC MAIN TABS AT TOP ---
  var $groupStatic = window.jQuery('<optgroup>').attr('label', '--- Haupttabs (Statisch) ---');
  STATIC_MAIN_TABS.forEach(tab => {
    $groupStatic.append(window.jQuery('<option>').val(tab.id).text(tab.label));
  });
  $select.append($groupStatic);

  // --- DYNAMIC MAIN/SUBTABS ---
  TABS.forEach(tab => {
    var $groupTab = window.jQuery('<optgroup>').attr('label', tab.name);
    (TAB_OPTIONS[tab.id] || []).forEach(opt => {
      $groupTab.append(window.jQuery('<option>').val(opt.id).text(opt.label));
    });
    $select.append($groupTab);
    (SUBTABS[tab.id] || []).forEach(subtab => {
      var $groupSub = window.jQuery('<optgroup>').attr('label', tab.name + ' > ' + subtab.name);
      (TAB_OPTIONS['sub_' + subtab.id] || []).forEach(opt => {
        $groupSub.append(window.jQuery('<option>').val(opt.id).text(opt.label));
      });
      $select.append($groupSub);
    });
  });

  $select.select2({
    placeholder: "Choose options...",
    width: 'resolve',
    closeOnSelect: false,
    allowClear: true,
    dropdownAutoWidth: true
  });

  $select.on("change", function() {
    var arr = $select.val() || [];
    var combo = arr.map(function(val){
      var sTab = STATIC_MAIN_TABS.find(t=>t.id===val);
      if (sTab) return sTab.label;
      for(let tab of TABS){
        let f1 = (TAB_OPTIONS[tab.id]||[]).find(o=>o.id==val);
        if(f1) return f1.label;
        for(let st of (SUBTABS[tab.id]||[])){
          let f2 = (TAB_OPTIONS['sub_'+st.id]||[]).find(o=>o.id==val);
          if(f2) return f2.label;
        }
      }
      return val;
    });
    $('#currentComboText').text(combo.join(' > '));
  });
  window.jQuery('#currentComboText').text('');
}
function populateComboOptionMultiSelect() {
  var $select = window.jQuery('#comboOptionMultiSelect');
  if ($select.data('select2')) $select.select2('destroy');
  $select.empty();

  // --- STATIC MAIN TABS AT TOP ---
  var $groupStatic = window.jQuery('<optgroup>').attr('label', '--- Haupttabs (Statisch) ---');
  STATIC_MAIN_TABS.forEach(tab => {
    $groupStatic.append(window.jQuery('<option>').val(tab.id).text(tab.label));
  });
  $select.append($groupStatic);

  // --- DYNAMIC MAIN/SUBTABS ---
  TABS.forEach(tab => {
    var $groupTab = window.jQuery('<optgroup>').attr('label', tab.name);
    (TAB_OPTIONS[tab.id] || []).forEach(opt => {
      $groupTab.append(window.jQuery('<option>').val(opt.id).text(opt.label));
    });
    $select.append($groupTab);
    (SUBTABS[tab.id] || []).forEach(subtab => {
      var $groupSub = window.jQuery('<optgroup>').attr('label', tab.name + ' > ' + subtab.name);
      (TAB_OPTIONS['sub_' + subtab.id] || []).forEach(opt => {
        $groupSub.append(window.jQuery('<option>').val(opt.id).text(opt.label));
      });
      $select.append($groupSub);
    });
  });

  $select.select2({
    placeholder: "Choose options...",
    width: 'resolve',
    closeOnSelect: false,
    allowClear: true,
    dropdownAutoWidth: true
  });
  $select.on("change", function() {
    var arr = $select.val() || [];
    var combo = arr.map(function(val){
      var sTab = STATIC_MAIN_TABS.find(t=>t.id===val);
      if (sTab) return sTab.label;
      for(let tab of TABS){
        let f1 = (TAB_OPTIONS[tab.id]||[]).find(o=>o.id==val);
        if(f1) return f1.label;
        for(let st of (SUBTABS[tab.id]||[])){
          let f2 = (TAB_OPTIONS['sub_'+st.id]||[]).find(o=>o.id==val);
          if(f2) return f2.label;
        }
      }
      return val;
    });
    $('#comboCurrentComboText').text(combo.join(' > '));
  });
  window.jQuery('#comboCurrentComboText').text('');
}

// --- EDIT OPTION MODAL LOGIC ---
const editModal = $('#editOptionModal');
const editForm = $('#editOptionForm');
const editIdInput = $('#editOptionId');
const editLabelInput = $('#editLabel');
const editValueKeyInput = $('#editValueKey');
const editImageUrlInput = $('#editImageUrl');
const editPriceInput = $('#editPrice');
const editExtraJsonInput = $('#editExtraJson');

window.editOption = function(optionObj) {
  // Decode JSON string values if passed as stringified JSON
  if (typeof optionObj === 'string') {
    try { optionObj = JSON.parse(optionObj); } catch(e) { alert('Invalid option data for editing'); return; }
  }

  editIdInput.value = optionObj.id || '';
  editLabelInput.value = optionObj.label || '';
  editValueKeyInput.value = optionObj.value_key || '';
  editImageUrlInput.value = optionObj.image_url || '';
  editPriceInput.value = optionObj.price || '';
  editExtraJsonInput.value = optionObj.extra_json || '{}';

  editModal.style.display = 'flex';
};

function closeEditModal() {
  editModal.style.display = 'none';
}

editForm.onsubmit = async e => {
  e.preventDefault();
  const id = editIdInput.value.trim();
  if (!id) return alert('Missing option ID');
  const label = editLabelInput.value.trim();
  const value_key = editValueKeyInput.value.trim();
  const image_url = editImageUrlInput.value.trim();
  const price = parseFloat(editPriceInput.value);
  let extra_json = editExtraJsonInput.value.trim();

  try {
    JSON.parse(extra_json);
  } catch(e) {
    alert('Extra JSON is invalid JSON format');
    return;
  }

  const payload = { id, label, value_key, image_url, price, extra_json };
  const res = await fetchAPI(api + '?action=update_option', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(payload)
  });
  if (!res.success) return alert('Failed to update option: ' + res.error);
  closeEditModal();
  await fetchTabs(); // reload all data and UI
};

window.onclick = function(e) {
  if (e.target === editModal) {
    closeEditModal();
  }
};

fetchTabs();
</script>
</body>
</html>
