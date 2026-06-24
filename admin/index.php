<?php

ini_set('memory_limit', '512M');
set_time_limit(60);
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


// ===== Load Product Types (for Tabs) =====
$productTypes = [];

$resPT = $conn->query("
    SELECT id, name
    FROM product_types
    WHERE status = 1
    ORDER BY sort_order
");

if ($resPT) {
    while ($row = $resPT->fetch_assoc()) {
        $productTypes[] = $row;
    }
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
        $stmt->bind_param("i", $tab_id); 
        $stmt->execute();
        $options = fetch_all_assoc($stmt->get_result());
    } else if (isset($_GET['subtab_id'])) {
        $subtab_id = (int)$_GET['subtab_id'];
        $stmt = $conn->prepare("SELECT * FROM tab_options WHERE subtab_id = ?");
        $stmt->bind_param("i", $subtab_id); 
        $stmt->execute();
        $options = fetch_all_assoc($stmt->get_result());
    }
    echo json_encode($options); 
    exit;
}


// ✅ ADD THIS RIGHT HERE
if ($action === 'get_option_full' && isset($_GET['id'])) {

    $id = (int)$_GET['id'];

    $stmt = $conn->prepare("SELECT * FROM tab_options WHERE id = ?");
    $stmt->bind_param("i", $id);
    $stmt->execute();

    $result = $stmt->get_result()->fetch_assoc();

    echo json_encode($result);
    exit;
}
  if ($action === 'create_tab') {
    $data = json_decode(file_get_contents("php://input"), true);
    $name = trim($data['name'] ?? '');
    $order = (int)($data['order_index'] ?? 0);
	
	$product_type_id = !empty($data['product_type_id']) ? (int)$data['product_type_id'] : null;

	
    if ($name === '' || $order <= 0) {
        echo json_encode(["success" => false, "error" => "Missing name or invalid order"]); exit;
    }
   // $stmt = $conn->prepare("INSERT INTO tabs (name, order_index) VALUES (?, ?)");
$stmt = $conn->prepare("INSERT INTO tabs (name, product_type_id, order_index) VALUES (?, ?, ?)");
   

   if (!$stmt) { echo json_encode(["success" => false, "error" => $conn->error]); exit; }
    //$stmt->bind_param("si", $name, $order);
	
	$stmt->bind_param("sii", $name, $product_type_id, $order);

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
		//$product_type_id = !empty($data['product_type_id']) ? (int)$data['product_type_id'] : null;

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
$option_type = trim($data['option_type'] ?? ''); // ✅ NEW


    // ✅ NEW: read dependency field (if any)
    $depends_on = isset($data['depends_on']) ? trim($data['depends_on']) : '';


        // --- Validation ---
$hasHeadingSubheading = isset($extra_obj['heading']) && $extra_obj['heading'] !== '';

if ((!$tab_id && !$subtab_id) || ($tab_id && $subtab_id)) {
    echo json_encode(["success" => false, "error" => "Select main tab OR subtab only"]);
    exit;
}

// Allow blank label for new custom types
$labelRequired = !in_array($option_type, ['inputField', 'selectWithImages']);

if ($labelRequired && $label === '' && !$hasHeadingSubheading) {
    echo json_encode(["success" => false, "error" => "Missing label or heading"]);
    exit;
}

// Default to heading as label if needed
if ($label === '' && $hasHeadingSubheading) {
    $label = $extra_obj['heading'];
}


        // Read section_id safely (optional)
$section_id = isset($data['section_id']) && $data['section_id'] !== '' ? (int)$data['section_id'] : null;
$depends_on = trim($data['depends_on'] ?? ''); // ✅ NEW: read dependency field



// Add section_id + depends_on to insert + binding
$stmt = $conn->prepare("
  INSERT INTO tab_options
    (tab_id, subtab_id, section_id, label, value_key, image_url, price, extra_json, option_type, depends_on)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
");

if (!$stmt) {
  echo json_encode(["success" => false, "error" => $conn->error]);
  exit;
}
$stmt->bind_param(
  "iiisssdsss",
  $tab_id,
  $subtab_id,
  $section_id,
  $label,
  $value_key,
  $image_url,
  $price,
  $extra_json,
  $option_type,
  $depends_on
);



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

        // Read section_id safely (optional)
$section_id = isset($data['section_id']) && $data['section_id'] !== '' ? (int)$data['section_id'] : null;

//$depends_on = trim($data['depends_on'] ?? '');

$depends_on = array_key_exists('depends_on', $data)
    ? trim($data['depends_on'])
    : null;
// Add section_id to the update + binding
$option_type = trim($data['option_type'] ?? '');

if ($depends_on !== null) {

    $stmt = $conn->prepare("
      UPDATE tab_options
      SET label=?, value_key=?, image_url=?, price=?, extra_json=?, section_id=?, option_type=?, depends_on=?
      WHERE id=?
    ");

    $stmt->bind_param("sssdssssi", 
        $label, $value_key, $image_url, $price, 
        $extra_json, $section_id, $option_type, 
        $depends_on, $id
    );

} else {

    $stmt = $conn->prepare("
      UPDATE tab_options
      SET label=?, value_key=?, image_url=?, price=?, extra_json=?, section_id=?, option_type=?
      WHERE id=?
    ");

    $stmt->bind_param("sssdsssi", 
        $label, $value_key, $image_url, $price, 
        $extra_json, $section_id, $option_type, 
        $id
    );
}

if (!$stmt) {
    echo json_encode(["success" => false, "error" => $conn->error]);
    exit;
}



if ($stmt->execute()) {

    $extra_obj = json_decode($extra_json, true);

    // 🔥 DELETE OLD DATA
    $conn->query("DELETE FROM height_width_prices WHERE option_parent_id = $id");
    $conn->query("DELETE FROM combo_options WHERE option_parent_id = $id");

    // 🔥 INSERT HEIGHT/WIDTH
    if (isset($extra_obj['combo_option_ids']) && isset($extra_obj['height_width_rows'])) {

        foreach ($extra_obj['height_width_rows'] as $row) {

            $combo_json = json_encode($extra_obj['combo_option_ids']);
            $height = $row['height'] ?? '';
            $width  = $row['width'] ?? '';
            $p = isset($row['price']) ? floatval($row['price']) : 0;

            $stmt2 = $conn->prepare("
                INSERT INTO height_width_prices 
                (option_parent_id, combo_option_ids, height, width, price) 
                VALUES (?, ?, ?, ?, ?)
            ");

            $stmt2->bind_param("isssd", $id, $combo_json, $height, $width, $p);
            $stmt2->execute();
        }
    }

    // 🔥 INSERT COMBO OPTIONS
    if (isset($extra_obj['combo_option_ids']) && isset($extra_obj['combo_rows'])) {

        foreach ($extra_obj['combo_rows'] as $row) {

            $combo_json = json_encode($extra_obj['combo_option_ids']);
            $heading = $row['heading'] ?? '';
            $subheading = $row['subheading'] ?? '';
            $image_url2 = $row['image_url'] ?? '';
            $p = isset($row['price']) ? floatval($row['price']) : 0;

            $stmt2 = $conn->prepare("
                INSERT INTO combo_options 
                (option_parent_id, combo_option_ids, heading, subheading, image_url, price) 
                VALUES (?, ?, ?, ?, ?, ?)
            ");

            $stmt2->bind_param("issssd", $id, $combo_json, $heading, $subheading, $image_url2, $p);
            $stmt2->execute();
        }
    }

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


// ===== SECTIONS CRUD =====
if ($action === 'get_sections' && isset($_GET['subtab_id'])) {
  $sid = (int)$_GET['subtab_id'];
  $res = $conn->prepare("SELECT * FROM subtab_sections WHERE subtab_id=? ORDER BY order_index,id");
  $res->bind_param("i", $sid);
  $res->execute();
  echo json_encode($res->get_result()->fetch_all(MYSQLI_ASSOC));
  exit;
}

if ($action === 'create_section') {
  $data = json_decode(file_get_contents("php://input"), true);
  $subtab_id = (int)($data['subtab_id'] ?? 0);
  $name = trim($data['name'] ?? '');
  $order = (int)($data['order_index'] ?? 0);
  //$product_type_id = !empty($data['product_type_id']) ? (int)$data['product_type_id'] : null;

  if (!$subtab_id || $name === '') { echo json_encode(["success"=>false,"error"=>"Missing subtab_id or name"]); exit; }
  $stmt = $conn->prepare("INSERT INTO subtab_sections (subtab_id, name, order_index) VALUES (?, ?, ?)");
  $stmt->bind_param("isi", $subtab_id, $name, $order);
  echo $stmt->execute()
    ? json_encode(["success"=>true, "id"=>$stmt->insert_id])
    : json_encode(["success"=>false,"error"=>$stmt->error]);
  exit;
}

if ($action === 'update_section') {
  $data = json_decode(file_get_contents("php://input"), true);
  $id = (int)($data['id'] ?? 0);
  $name = trim($data['name'] ?? '');
  $order = (int)($data['order_index'] ?? 0);
  //$product_type_id = !empty($data['product_type_id']) ? (int)$data['product_type_id'] : null;

  if (!$id || $name === '') { echo json_encode(["success"=>false,"error"=>"Missing id or name"]); exit; }
  $stmt = $conn->prepare("UPDATE subtab_sections SET name=?, order_index=? WHERE id=?");
  $stmt->bind_param("sii", $name, $order, $id);
  echo $stmt->execute() ? json_encode(["success"=>true]) : json_encode(["success"=>false,"error"=>$stmt->error]);
  exit;
}

if ($action === 'delete_section' && isset($_GET['id'])) {
  $id = (int)$_GET['id'];
  $conn->query("DELETE FROM subtab_sections WHERE id=$id");
  echo json_encode(["success"=>true]);
  exit;
}




/* 🔽🔽🔽 PASTE STEP 5 CODE EXACTLY HERE 🔽🔽🔽 */





if ($action === 'get_all_data') {

    // 1. Get all tabs
    $tabs = $conn->query("
        SELECT * FROM tabs 
        ORDER BY order_index ASC
    ")->fetch_all(MYSQLI_ASSOC);

    // 2. Get all subtabs
    $subtabs = $conn->query("
        SELECT * FROM subtabs 
        ORDER BY order_index ASC
    ")->fetch_all(MYSQLI_ASSOC);

    // 3. Get all options (FIXED ✅ include image + extra_json)
    $options = $conn->query("
        SELECT id, tab_id, subtab_id, label, value_key, price, image_url, extra_json, depends_on
        FROM tab_options
        LIMIT 5000
    ")->fetch_all(MYSQLI_ASSOC);


    // 🔥 4. GET ALL COMBO OPTIONS (THIS WAS MISSING)
    $comboRows = $conn->query("
        SELECT option_parent_id, heading, subheading, image_url, price
        FROM combo_options
    ")->fetch_all(MYSQLI_ASSOC);

    // 🔥 MAP combo rows by option id
    $comboMap = [];
    foreach ($comboRows as $row) {
        $comboMap[$row['option_parent_id']][] = $row;
    }

    // 🔥 ATTACH combo rows to each option
    foreach ($options as &$opt) {
        $opt['combo_rows'] = $comboMap[$opt['id']] ?? [];
    }
    unset($opt);


    // 5. Group subtabs by tab_id
    $subtabsByTab = [];
    foreach ($subtabs as $sub) {
        $sub['options'] = [];
        $subtabsByTab[$sub['tab_id']][] = $sub;
    }

    // 6. Group options
    $optionsByTab = [];
    $optionsBySubtab = [];

    foreach ($options as $opt) {
        if (!empty($opt['tab_id'])) {
            $optionsByTab[$opt['tab_id']][] = $opt;
        }
        if (!empty($opt['subtab_id'])) {
            $optionsBySubtab[$opt['subtab_id']][] = $opt;
        }
    }

    // 7. Attach everything
    foreach ($tabs as &$tab) {
        $tab_id = $tab['id'];

        $tab['options'] = $optionsByTab[$tab_id] ?? [];

        $tab['subtabs'] = $subtabsByTab[$tab_id] ?? [];

        foreach ($tab['subtabs'] as &$sub) {
            $sub_id = $sub['id'];
            $sub['options'] = $optionsBySubtab[$sub_id] ?? [];
        }
    }

    // 8. Output JSON
    $json = json_encode($tabs);

    if ($json === false) {
        echo json_encode([
            "error" => "JSON encode failed",
            "message" => json_last_error_msg()
        ]);
    } else {
        echo $json;
    }

    exit;
}



/**********

if ($action === 'get_all_data') {

    // 1. Get all tabs
    $tabs = $conn->query("SELECT * FROM tabs ORDER BY order_index ASC")->fetch_all(MYSQLI_ASSOC);

    // 2. Get all subtabs (ONE QUERY)
    $subtabs = $conn->query("SELECT * FROM subtabs ORDER BY order_index ASC")->fetch_all(MYSQLI_ASSOC);

    // 3. Get all options (LIMITED)
  $options = $conn->query("
    SELECT id, tab_id, subtab_id, label, value_key, price 
    FROM tab_options 
    LIMIT 1000
")->fetch_all(MYSQLI_ASSOC);
    // 4. Group subtabs by tab_id
    $subtabsByTab = [];
    foreach ($subtabs as $sub) {
        $sub['options'] = [];
        $subtabsByTab[$sub['tab_id']][] = $sub;
    }

    // 5. Group options
    $optionsByTab = [];
    $optionsBySubtab = [];

    foreach ($options as $opt) {
        if (!empty($opt['tab_id'])) {
            $optionsByTab[$opt['tab_id']][] = $opt;
        }
        if (!empty($opt['subtab_id'])) {
            $optionsBySubtab[$opt['subtab_id']][] = $opt;
        }
    }

    // 6. Attach everything
    foreach ($tabs as &$tab) {
        $tab_id = $tab['id'];

        $tab['options'] = $optionsByTab[$tab_id] ?? [];

        $tab['subtabs'] = $subtabsByTab[$tab_id] ?? [];

        foreach ($tab['subtabs'] as &$sub) {
            $sub_id = $sub['id'];
            $sub['options'] = $optionsBySubtab[$sub_id] ?? [];
        }
    }

   $json = json_encode($tabs);

if ($json === false) {
    echo json_encode([
        "error" => "JSON encode failed",
        "message" => json_last_error_msg()
    ]);
} else {
    echo $json;
}

exit;
}

*************/



if ($action === 'get_tabs_for_product_type') {
    $res = $conn->query("SELECT id, name, product_type_id FROM tabs ORDER BY id ASC");
    $tabs = [];
    while ($row = $res->fetch_assoc()) {
        $tabs[] = $row;
    }
    echo json_encode($tabs);
    exit;
}

if ($action === 'update_tab_product_type') {
    $data = json_decode(file_get_contents("php://input"), true);
    $tabId = (int)$data['tab_id'];
    $productTypeId = !empty($data['product_type_id']) ? (int)$data['product_type_id'] : null;

    $stmt = $conn->prepare("UPDATE tabs SET product_type_id = ? WHERE id = ?");
    $stmt->bind_param("ii", $productTypeId, $tabId);

    echo $stmt->execute()
        ? json_encode(['success' => true])
        : json_encode(['success' => false, 'error' => $stmt->error]);
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

.extra-json-display {
    max-height: 100px;
    overflow: scroll;
    overflow-x: hidden;
}
#optionsTable img.thumb {
    width: 50px;
}
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
  
  <h2>Assign Product Type to Existing Tabs</h2>

<table border="1" width="100%" cellpadding="6">
  <thead>
    <tr>
      <th>Tab ID</th>
      <th>Tab Name</th>
      <th>Product Type</th>
      <th>Action</th>
    </tr>
  </thead>
  <tbody id="tabProductTypeTable"></tbody>
</table>

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

<!-- ===== Sections Manager (new) ===== -->
<div id="sectionSection" style="margin-top:30px;">
  <h3>Manage Sections (under a Subtab)</h3>

  <div class="row" style="gap:8px; margin:10px 0;">
    <!-- We reuse the Subtab list so you can choose which subtab to add sections to -->
    <select id="subtabSelectForSection" style="min-width:260px;"></select>

    <input type="text" id="sectionName" placeholder="Section name" />
    <input type="number" id="sectionOrder" placeholder="Order" min="0" value="0" style="width:120px;" />
    <button id="addSectionBtn">Add Section</button>
  </div>

  <table id="sectionsTable" class="table">
    <thead>
      <tr>
        <th>Name</th>
        <th style="width:120px;">Order</th>
        <th style="width:220px;">Action</th>
      </tr>
    </thead>
    <tbody></tbody>
  </table>
</div>


<h2>Add Option to Tab / Subtab</h2>
<form id="optionForm">
  <div class="row">
    <select id="tabSubtabSelect"></select>

<!-- ===== Section dropdown ===== -->
<div class="row" id="sectionRow" style="display:none; gap:8px; margin-top:8px;">
  <label style="min-width:140px;">Section (optional)</label>
  <select id="sectionSelect" name="section_id" style="min-width:260px;">
    <option value="">— None —</option>
  </select>
  <button type="button" id="refreshSectionsBtn" title="Reload sections">↻</button>
</div>


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
<option value="inputField">Input (Text Field)</option>
  <option value="selectWithImages">Select (With Images)</option>

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


<!-- NEW TYPE: Input Field -->
<div id="inputFieldEditor" style="display:none; margin-top:15px;">
  <label><b>Input Field Settings</b></label>

  <!-- Existing fields -->
  <input type="text" id="inputLabel" placeholder="Label text for input field" />
  <input type="text" id="inputPlaceholder" placeholder="Placeholder text (optional)" />

  <!-- ✅ NEW FIELD: Default Value -->
  <input type="text" id="inputValue" placeholder="Value (optional)" />
</div>


<!-- NEW TYPE: Select With Images -->
<div id="selectWithImagesEditor" style="display:none;">
  <label for="selectWithImagesLabel"><b>Select Label</b></label>
  <input type="text" id="selectWithImagesLabel" placeholder="Dropdown Label (z. B. Kastenfarbe wählen)">

  <label><b>Default / First Option</b></label>
  <p style="font-size:13px; color:#555; margin-top:-8px;">
    Leave blank for “Bitte wählen …” or enter a label + image to preselect a default.
  </p>

  <div class="list-item">
    <input type="text" id="selectWithImagesDefaultLabel" placeholder="Default Option Label (optional)">
    <input type="text" id="selectWithImagesDefaultImage" placeholder="Default Option Image URL or inline SVG (optional)">
  </div>

  <hr style="margin:10px 0;">

  <label><b>Dropdown Options (with Images)</b></label>
  <div id="selectImageOptionsContainer"></div>
  <button type="button" id="addSelectImageOptionBtn">Add Option</button>
</div>



<div style="margin-top:10px;">
  <label>Depends On (optional)</label>
  <select id="dependsOnSelect" multiple style="width:100%;"></select>
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
/* ----------------------------- BASE VARIABLES ----------------------------- */
const STATIC_MAIN_TABS = [
  { id: "__static_ksf__", label: "Kunststofffenster", shortcode: "Kunststofffenster" },
  { id: "__static_schiebe__", label: "Schiebetüren", shortcode: "Schiebetüren" },
  { id: "__static_balkon__", label: "Balkonfenster", shortcode: "Balkonfenster" }
];
const api = window.location.origin + window.location.pathname;
const $ = sel => document.querySelector(sel), $$ = sel => document.querySelectorAll(sel);
const listItemsContainer = $('#listItemsContainer'), addListItemBtn = $('#addListItemBtn'),
      checkmarkUrlInput = $('#checkmarkUrl'), extraJsonInput = $('#extraJson'),
      optionTypeSelect = $('#optionTypeSelect'), listEditor = $('#listEditor'),
      headingSubheadingEditor = $('#headingSubheadingEditor'),
      mainTabSelectForSubtab = $('#mainTabSelectForSubtab'),
      subtabSection = $('#subtabSection'), subtabSelect = $('#subtabSelect'),
      tabSubtabSelect = $('#tabSubtabSelect'), tabsTableBody = $('#tabsTable tbody'),
      bottomMainTabSelect = $('#bottomMainTabSelect'),
      bottomSubtabSelect = $('#bottomSubtabSelect'),
      optionsTableBody = $('#optionsTable tbody');

/* --- NEW SECTION MANAGER ELEMENTS --- */
const subtabSelectForSection = $('#subtabSelectForSection'),
      sectionNameInput = $('#sectionName'),
      sectionOrderInput = $('#sectionOrder'),
      addSectionBtn = $('#addSectionBtn'),
      sectionsTableBody = document.querySelector('#sectionsTable tbody'),
      sectionRow = $('#sectionRow'),
      sectionSelect = $('#sectionSelect'),
      refreshSectionsBtn = $('#refreshSectionsBtn');

/* ------------------------------- GLOBALS --------------------------------- */
let currentTargetTabId = null, currentTargetSubtabId = null;
let TABS = [], SUBTABS = {}, TAB_OPTIONS = {};
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
  // --- show/hide each editor panel ---
  listEditor.style.display = optionTypeSelect.value === 'listing' ? 'block' : 'none';
  headingSubheadingEditor.style.display = optionTypeSelect.value === 'headingSubheading' ? 'block' : 'none';
  document.getElementById('heightWidthTabEditor').style.display = optionTypeSelect.value === 'heightWidthTab' ? 'block' : 'none';
  document.getElementById('comboOptionEditor').style.display = optionTypeSelect.value === 'comboOption' ? 'block' : 'none';
  document.getElementById('inputFieldEditor').style.display = optionTypeSelect.value === 'inputField' ? 'block' : 'none';
  document.getElementById('selectWithImagesEditor').style.display = optionTypeSelect.value === 'selectWithImages' ? 'block' : 'none';

  // --- reinitialize data if needed ---
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

  if (optionTypeSelect.value === 'selectWithImages') {
    // reset select-with-images editor each time you open it
    if (typeof resetSelectOptionsEditor === 'function') resetSelectOptionsEditor();
  }

if (optionTypeSelect.value === 'inputField') {
  const labelInput = document.getElementById('inputLabel');
  const placeholderInput = document.getElementById('inputPlaceholder');
  const valueInput = document.getElementById('inputValue'); // ✅
  if (labelInput) labelInput.value = '';
  if (placeholderInput) placeholderInput.value = '';
  if (valueInput) valueInput.value = ''; // ✅
}

};

optionTypeSelect.dispatchEvent(new Event('change'));

async function fetchAPI(url, opts) { 

return fetch(url, opts).then(async r => {
  const text = await r.text();

  if (!text) {
    throw new Error("Empty response from server");
  }

  try {
    return JSON.parse(text);
  } catch (e) {
    console.error("Broken JSON:", text);
    throw e;
  }
});
}
async function fetchTabs() {
  TABS = await fetchAPI(api + '?action=get_all_data');

  SUBTABS = {};
  TAB_OPTIONS = {};

  for (const tab of TABS) {
    SUBTABS[tab.id] = tab.subtabs || [];
    TAB_OPTIONS[tab.id] = tab.options || [];

    for (const sub of SUBTABS[tab.id]) {
      TAB_OPTIONS['sub_' + sub.id] = sub.options || [];
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
tabSubtabSelect.onchange = async function() {
  const val = tabSubtabSelect.value;
  if (val.startsWith('tab_')) {
    currentTargetTabId = parseInt(val.replace('tab_','')); 
    currentTargetSubtabId = null;
  } else if (val.startsWith('subtab_')) {
    currentTargetTabId = null; 
    currentTargetSubtabId = parseInt(val.replace('subtab_',''));
  } else { 
    currentTargetTabId = null; 
    currentTargetSubtabId = null; 
  }
  updateAddOptionButtonState();

// ✅ NEW: refresh depends-on dropdown for this subtab
  populateDependsOnSelect(currentTargetSubtabId);

  // --- 🔥 New part: fetch and show sections for the selected subtab
  if (currentTargetSubtabId) {
    const list = await fetchSections(currentTargetSubtabId);
    if (sectionRow) sectionRow.style.display = 'flex';
    populateSectionSelect(list);
    if (subtabSelectForSection) {
      subtabSelectForSection.value = currentTargetSubtabId;
      renderSectionsTable(list);
    }
  } else {
    if (sectionRow) sectionRow.style.display = 'none';
    if (sectionSelect) sectionSelect.innerHTML = '<option value="">— None —</option>';
  }
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


// --- populate "Manage Sections" dropdown ---
if (subtabSelectForSection) {
  subtabSelectForSection.innerHTML = '';
  for (const tab of TABS) {
    (SUBTABS[tab.id] || []).forEach(st => {
      const opt = document.createElement('option');
      opt.value = st.id;
      opt.textContent = `${tab.name} → ${st.name}`;
      subtabSelectForSection.appendChild(opt);
    });
  }
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

  let i = 0;
  const chunkSize = 100; // how many rows per frame

  optionsTableBody.innerHTML = '';

  function renderChunk() {

    const slice = options.slice(i, i + chunkSize);

    const html = slice.map(o => {

      let extraObj = {};
      try { extraObj = JSON.parse(o.extra_json || '{}'); } catch(e){}

      let extraHtml = '<div class="extra-json-display">';

      if (extraObj.subheading)
        extraHtml += `<p><strong>Subheading:</strong> ${extraObj.subheading}</p>`;

      if (extraObj.items && Array.isArray(extraObj.items)) {
        extraHtml += '<ul>';
        const checkmarkSrc = extraObj.checkmark_image_url || 'https://droplify.de/deine-fenster24/frontend/checkmark.svg';
        extraObj.items.forEach(item => {
          extraHtml += `<li><img src="${checkmarkSrc}" alt="checkmark">${item}</li>`;
        });
        extraHtml += '</ul>';
      }

      // Height/Width Table
      if (extraObj.combo_option_ids && extraObj.height_width_rows) {
        extraHtml += `<div><strong>Option Combo:</strong> ${
          Array.isArray(extraObj.combo_option_ids)
            ? extraObj.combo_option_ids.join(' > ')
            : ''
        }</div>`;

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
        extraHtml += '<div><strong>Option Combo:</strong> ' +
          (Array.isArray(extraObj.combo_option_ids)
            ? extraObj.combo_option_ids.join(' > ')
            : '') + '</div>';

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
    }).join('');

    optionsTableBody.insertAdjacentHTML('beforeend', html);

    i += chunkSize;

    if (i < options.length) {
      requestAnimationFrame(renderChunk);
    }
  }

  if (!options.length) {
    optionsTableBody.innerHTML =
      '<tr><td colspan="7" style="text-align:center; font-style:italic;">No options found.</td></tr>';
    return;
  }

  renderChunk();
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
  ///console.log("skip reload");

// --- refresh Sections dropdown so new subtabs appear there ---
if (typeof subtabSelectForSection !== 'undefined' && subtabSelectForSection) {
  subtabSelectForSection.innerHTML = '';
  for (const tab of TABS) {
    (SUBTABS[tab.id] || []).forEach(st => {
      const opt = document.createElement('option');
      opt.value = st.id;
      opt.textContent = `${tab.name} → ${st.name}`;
      subtabSelectForSection.appendChild(opt);
    });
  }
}


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
  e.target.reset(); 
  await fetchTabs();
  ////console.log("skip reload");
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



// ---------- Select With Images: Dynamic Rows ----------
function createSelectOptionRow(label = '', image = '') {
  const div = document.createElement('div');
  div.className = 'list-item';
  div.style.display = 'flex';
  div.style.alignItems = 'center';
  div.style.gap = '8px';
  div.innerHTML = `
    <input type="text" class="select-opt-label" value="${label}" placeholder="Option label" style="flex:2;">
    <input type="text" class="select-opt-image" value="${image}" placeholder="Image URL (optional)" style="flex:3;">
    <button type="button" class="removeSelectOption" style="flex:1;background:#d9534f;color:white;border:none;padding:6px 12px;border-radius:3px;cursor:pointer;">Remove</button>
  `;
  div.querySelector('.removeSelectOption').onclick = () => div.remove();
  return div;
}

function resetSelectOptionsEditor() {
  const cont = document.getElementById('selectOptionsContainer');
  if (!cont) return;
  cont.innerHTML = '';
  cont.appendChild(createSelectOptionRow());
}

// bind the "Add Option" button
const addSelectOptionBtn = document.getElementById('addSelectOptionBtn');
if (addSelectOptionBtn) {
  addSelectOptionBtn.onclick = () => {
    const cont = document.getElementById('selectOptionsContainer');
    if (cont) cont.appendChild(createSelectOptionRow());
  };
}

// initialize once on load
resetSelectOptionsEditor();



// ----- SELECT WITH IMAGES EDITOR LOGIC -----
const selectImageOptionsContainer = document.getElementById('selectImageOptionsContainer');
const addSelectImageOptionBtn = document.getElementById('addSelectImageOptionBtn');
const defaultLabelInput = document.getElementById('selectWithImagesDefaultLabel');
const defaultImageInput = document.getElementById('selectWithImagesDefaultImage');

function makeSelectImageRow(label='', image='') {
  const row = document.createElement('div');
  row.className = 'list-item';
  row.innerHTML = `
    <input type="text" class="imgopt-label" placeholder="Label" value="${label}">
    <input type="text" class="imgopt-url" placeholder="Image URL or inline SVG" value="${image}">
    <button type="button">Remove</button>
  `;
  row.querySelector('button').onclick = () => row.remove();
  return row;
}

addSelectImageOptionBtn.onclick = () => {
  const row = makeSelectImageRow();
  selectImageOptionsContainer.appendChild(row);
};





$('#optionForm').onsubmit = async e => {
  e.preventDefault();
  if (!(currentTargetTabId || currentTargetSubtabId)) return alert('Please select a tab or subtab to add the option.');
  const labelInput = $('#label').value.trim(), optionType = optionTypeSelect.value;
  let extraJsonObj = {}, label = labelInput;

  if (optionType === 'headingSubheading') {
  const headingInput = $('#headingInput').value.trim();
  const subheadingInput = $('#subheadingInput').value.trim();
  if (headingInput === '') return alert('Heading is required for Heading & Subheading option');
  label = '';
  extraJsonObj.heading = headingInput;
  extraJsonObj.subheading = subheadingInput;

} else if (optionType === 'listing') {
  const items = Array.from(listItemsContainer.querySelectorAll('input[type=text]'))
    .map(input => input.value.trim())
    .filter(v => v.length);
  if (label === '') return alert('Label is required for Listing option');
  extraJsonObj.items = items;
  extraJsonObj.checkmark_image_url = checkmarkUrlInput.value.trim() || 
    "https://droplify.de/deine-fenster24/frontend/checkmark.svg";

} else if (optionType === 'heightWidthTab') {
  const $select = window.jQuery('#optionMultiSelect');
  const selectedIds = $select.val();
  if (!selectedIds || selectedIds.length < 1) return alert('Select at least one option for the combination!');
  const hwRows = getHeightWidthRows();
  if (hwRows.length === 0) return alert('Add at least one width/height/price row!');
  extraJsonObj.combo_option_ids = selectedIds;
  extraJsonObj.height_width_rows = hwRows;
  if (label === '') label = 'HW Combo: ' + selectedIds.join(' > ');

} else if (optionType === 'comboOption') {
  const $select = window.jQuery('#comboOptionMultiSelect');
  const selectedIds = $select.val();
  if (!selectedIds || selectedIds.length < 1) return alert('Select at least one option for the combination!');
  const comboRows = getComboRows();
  if (comboRows.length === 0) return alert('Add at least one row!');
  extraJsonObj.combo_option_ids = selectedIds;
  extraJsonObj.combo_rows = comboRows;
  if (label === '') label = 'Combo: ' + selectedIds.join(' > ');

} else if (optionType === 'inputField') {
  const labelText = $('#inputLabel').value.trim();
  const placeholderText = $('#inputPlaceholder').value.trim();
  const valueText = $('#inputValue').value.trim(); // ✅ new

  extraJsonObj.type = 'inputField';
  extraJsonObj.input_label = labelText;
  extraJsonObj.placeholder = placeholderText;
  extraJsonObj.value = valueText; // ✅ new
} else if (optionType === 'selectWithImages') {
  const dropdownLabel = document.getElementById('selectWithImagesLabel').value.trim();
  const defaultLabel = document.getElementById('selectWithImagesDefaultLabel').value.trim();
  const defaultImage = document.getElementById('selectWithImagesDefaultImage').value.trim();

  const opts = [];
  document.querySelectorAll('#selectImageOptionsContainer .list-item').forEach(row => {
    const lbl = row.querySelector('.imgopt-label').value.trim();
    const img = row.querySelector('.imgopt-url').value.trim();
    if (lbl) opts.push({ label: lbl, image: img });
  });

  // ✅ Always create a dropdown label, even if options are empty
  extraJsonObj.dropdown_label = dropdownLabel || 'Option wählen';

  // ✅ Default optional
  if (defaultLabel || defaultImage) {
    extraJsonObj.default_option = { label: defaultLabel, image: defaultImage };
  } else {
    extraJsonObj.default_option = null;
  }

  // ✅ Options can be empty
  extraJsonObj.options = opts;
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

  data.option_type = optionTypeSelect.value;


// ✅ Attach section ID if selected
const secVal = sectionSelect ? sectionSelect.value : '';
if (secVal) data.section_id = parseInt(secVal, 10);

// ✅ Collect "Depends On" dropdown values
const dependsSelect = document.getElementById('dependsOnSelect');
if (dependsSelect) {
  const values = Array.from(dependsSelect.selectedOptions).map(o => o.value);
  data.depends_on = values.join(',');
}

  const result = await fetchAPI(api + '?action=create_option', {
    method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data)
  });
  if (!result.success) return alert('Failed to add option: ' + result.error);
  e.target.reset(); resetListEditor(); clearHeightWidthRows(); clearComboRows(); optionTypeSelect.value = 'listing'; optionTypeSelect.dispatchEvent(new Event('change'));
  await fetchTabs();
  ///console.log("skip reload");
};

window.deleteTab = async id => {
  if (!confirm('Delete this tab? All related subtabs and options will also be deleted.')) return;
  await fetchAPI(api + `?action=delete_tab&id=${id}`); 
  
  await fetchTabs();
  
  ///console.log("skip reload");
};
window.deleteSubtab = async (id) => {
  if (!confirm('Delete this subtab? All related options will also be deleted.')) return;
  await fetchAPI(api + `?action=delete_subtab&id=${id}`); 
  
  await fetchTabs();
  
  //console.log("skip reload");
};
window.deleteOption = async (id) => {
  if (!confirm('Delete this option?')) return;
  await fetchAPI(api + `?action=delete_option&id=${id}`); 
  
  await fetchTabs();
  
  ///console.log("skip reload");
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
    ///(TAB_OPTIONS[tab.id] || []).forEach(opt => {
		(TAB_OPTIONS[tab.id] || []).forEach(opt => {
      $groupTab.append(window.jQuery('<option>').val(opt.id).text(opt.label));
    });
    $select.append($groupTab);
    (SUBTABS[tab.id] || []).forEach(subtab => {
      var $groupSub = window.jQuery('<optgroup>').attr('label', tab.name + ' > ' + subtab.name);
      ///(TAB_OPTIONS['sub_' + subtab.id] || []).forEach(opt => {
		  
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
    ///(TAB_OPTIONS[tab.id] || []).forEach(opt => {
		
		(TAB_OPTIONS[tab.id] || []).forEach(opt => {
      $groupTab.append(window.jQuery('<option>').val(opt.id).text(opt.label));
    });
    $select.append($groupTab);
    (SUBTABS[tab.id] || []).forEach(subtab => {
      var $groupSub = window.jQuery('<optgroup>').attr('label', tab.name + ' > ' + subtab.name);
     /// (TAB_OPTIONS['sub_' + subtab.id] || []).forEach(opt => {
		 
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



function populateDependsOnSelect(currentSubtabId) {

  const select = document.getElementById('dependsOnSelect');
  if (!select) return;

  select.innerHTML = '';

  let allOptions = [];

  // collect ALL options (tab + subtab)
  Object.values(TAB_OPTIONS).forEach(list => {
    (list || []).forEach(o => {
      allOptions.push(o);
    });
  });

  // ✅ REMOVE duplicates (important)
  const seen = new Set();
  allOptions = allOptions.filter(o => {
    if (seen.has(o.id)) return false;
    seen.add(o.id);
    return true;
  });

  // ✅ Build dropdown
  allOptions.forEach(opt => {
    const option = document.createElement('option');
    option.value = opt.id;

    // show context (VERY IMPORTANT for UX)
    let label = opt.label || `Option ${opt.id}`;

    if (opt.subtab_id) {
      label = `[Subtab ${opt.subtab_id}] ${label}`;
    } else if (opt.tab_id) {
      label = `[Tab ${opt.tab_id}] ${label}`;
    }

    option.textContent = label;
    select.appendChild(option);
  });

  // re-init select2
  if (window.jQuery && window.jQuery(select).select2) {
    window.jQuery(select).select2({
      placeholder: 'Choose dependencies',
      width: 'resolve',
      allowClear: true
    });
  }
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

window.editOption = async function(optionObj) {

  const full = await fetchAPI(api + '?action=get_option_full&id=' + optionObj.id);

  if (!full) {
    alert("Failed to load full option data");
    return;
  }

  editIdInput.value = full.id || '';
  editLabelInput.value = full.label || '';
  editValueKeyInput.value = full.value_key || '';
  editImageUrlInput.value = full.image_url || '';
  editPriceInput.value = full.price || '';
  editExtraJsonInput.value = full.extra_json || '{}';

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
 
 //console.log("skip reload");
};

window.onclick = function(e) {
  if (e.target === editModal) {
    closeEditModal();
  }
};

fetchTabs();


// Fetch, render, and fill functions
async function fetchSections(subtabId) {
  return fetch(api + '?action=get_sections&subtab_id=' + subtabId).then(r => r.json());
}
function renderSectionsTable(list) {
  if (!sectionsTableBody) return;
  sectionsTableBody.innerHTML = '';
  list.forEach(sec => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><input type="text" class="sec-name" value="${sec.name||''}"></td>
      <td><input type="number" class="sec-order" value="${sec.order_index||0}" style="width:80px"></td>
      <td>
        <button class="sec-update" data-id="${sec.id}">Update</button>
        <button class="sec-delete" data-id="${sec.id}" style="margin-left:6px;">Delete</button>
      </td>`;
    sectionsTableBody.appendChild(tr);
  });
}
function populateSectionSelect(list){
  if (!sectionSelect) return;
  sectionSelect.innerHTML = '<option value="">— None —</option>';
  list.forEach(sec => {
    const o = document.createElement('option');
    o.value = sec.id;
    o.textContent = sec.name;
    sectionSelect.appendChild(o);
  });
}
async function refreshSectionsUI(){
  const sid = subtabSelectForSection?.value;
  if (!sid) return sectionsTableBody.innerHTML = '';
  const list = await fetchSections(sid);
  renderSectionsTable(list);
  populateSectionSelect(list);


  if (currentTargetSubtabId) populateSectionSelect(list);

}

/* --- Section Buttons --- */
if(addSectionBtn){
  addSectionBtn.onclick = async () => {
    const subtabId = subtabSelectForSection.value,
          name = sectionNameInput.value.trim(),
          order = parseInt(sectionOrderInput.value || '0',10);
    if (!subtabId || !name) return alert('Select a subtab and enter section name');
    const res = await fetch(api+'?action=create_section', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({ subtab_id:parseInt(subtabId,10), name, order_index:order })
    }).then(r=>r.json());
    if (!res.success) return alert(res.error||'Failed to create section');
    sectionNameInput.value = ''; sectionOrderInput.value = 0;
    refreshSectionsUI();
  };
}

/* --- Section Table actions --- */
if(sectionsTableBody){
  sectionsTableBody.onclick = async e => {
    if (e.target.classList.contains('sec-update')) {
      const tr = e.target.closest('tr');
      const id = e.target.dataset.id;
      const name = tr.querySelector('.sec-name').value.trim();
      const order = tr.querySelector('.sec-order').value;
      await fetch(api+'?action=update_section',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({id,name,order_index:order})
      });
      refreshSectionsUI();
    }
    if (e.target.classList.contains('sec-delete')) {
      const id = e.target.dataset.id;
      if (!confirm('Delete this section?')) return;
      await fetch(api+'?action=delete_section&id='+id);
      refreshSectionsUI();
    }
  };
}
if(subtabSelectForSection){ subtabSelectForSection.onchange = refreshSectionsUI; }
if(refreshSectionsBtn){ refreshSectionsBtn.onclick = refreshSectionsUI; }

/* --- Show section dropdown when a subtab is selected --- */
async function syncSectionDropdown(subtabId){
  if (!sectionRow || !sectionSelect) return;
  if (!subtabId){ sectionRow.style.display='none'; sectionSelect.innerHTML='<option value="">— None —</option>'; return; }
  sectionRow.style.display='flex';
  const list = await fetchSections(subtabId);
  populateSectionSelect(list);
  if(subtabSelectForSection){ subtabSelectForSection.value=subtabId; refreshSectionsUI(); }
}

/* --- Patch your existing tabSubtabSelect.onchange --- */
const origChange = document.querySelector('#tabSubtabSelect')?.onchange;
if(document.querySelector('#tabSubtabSelect')){
  document.querySelector('#tabSubtabSelect').onchange = async function(){
    const val = this.value;
    if (val.startsWith('tab_')) {
      currentTargetTabId = parseInt(val.replace('tab_','')); currentTargetSubtabId = null;
    } else if (val.startsWith('subtab_')) {
      currentTargetTabId = null; currentTargetSubtabId = parseInt(val.replace('subtab_',''));
    } else { currentTargetTabId = null; currentTargetSubtabId = null; }
    if (typeof updateAddOptionButtonState === 'function') updateAddOptionButtonState();
    await syncSectionDropdown(currentTargetSubtabId);
    if (typeof origChange === 'function') origChange.call(this);
  };
}



</script>



<script>
function loadTabProductTypes() {
  fetch('index.php?action=get_tabs_for_product_type')
    .then(res => res.json())
    .then(tabs => {
      const tbody = document.getElementById('tabProductTypeTable');
      tbody.innerHTML = '';

      tabs.forEach(tab => {
        let options = `<option value="">-- Select --</option>`;

        <?php foreach ($productTypes as $pt): ?>
          options += `<option value="<?= $pt['id']; ?>" ${tab.product_type_id == <?= $pt['id']; ?> ? 'selected' : ''}>
            <?= htmlspecialchars($pt['name']); ?>
          </option>`;
        <?php endforeach; ?>

        tbody.innerHTML += `
          <tr>
            <td>${tab.id}</td>
            <td>${tab.name}</td>
            <td>
              <select id="pt_${tab.id}">
                ${options}
              </select>
            </td>
            <td>
              <button onclick="saveTabProductType(${tab.id})">Save</button>
            </td>
          </tr>
        `;
      });
    });
}





function loadTabProductTypes() {
  fetch('index.php?action=get_tabs_for_product_type')
    .then(res => res.json())
    .then(tabs => {
      const tbody = document.getElementById('tabProductTypeTable');
      tbody.innerHTML = '';

      tabs.forEach(tab => {
        let options = `<option value="">-- Select --</option>`;

        <?php foreach ($productTypes as $pt): ?>
          options += `<option value="<?= $pt['id']; ?>" ${tab.product_type_id == <?= $pt['id']; ?> ? 'selected' : ''}>
            <?= htmlspecialchars($pt['name']); ?>
          </option>`;
        <?php endforeach; ?>

        tbody.innerHTML += `
          <tr>
            <td>${tab.id}</td>
            <td>${tab.name}</td>
            <td>
              <select id="pt_${tab.id}">
                ${options}
              </select>
            </td>
            <td>
              <button onclick="saveTabProductType(${tab.id})">Save</button>
            </td>
          </tr>
        `;
      });
    });
}



function saveTabProductType(tabId) {
  const productTypeId = document.getElementById('pt_' + tabId).value;

  fetch('index.php?action=update_tab_product_type', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tab_id: tabId,
      product_type_id: productTypeId
    })
  })
  .then(res => res.json())
  .then(resp => {
    if (resp.success) {
      alert('Saved');
    } else {
      alert(resp.error);
    }
  });
}



loadTabProductTypes();

</script>

</body>
</html>
