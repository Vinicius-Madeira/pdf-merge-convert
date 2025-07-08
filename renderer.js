const { ipcRenderer } = require("electron");

const selectBtn = document.getElementById("select");
const clearBtn = document.getElementById("clear");
const mergeBtn = document.getElementById("merge");
const convertSingleBtn = document.getElementById("convert-single");
const convertBtn = document.getElementById("convert");
const fileList = document.getElementById("file-list");
const mergeStatus = document.getElementById("merge-status");
const status = document.getElementById("status");
const pagesContainer = document.getElementById("pages-container");

let selectedFiles = [];
let mergedFilePath = null;
let pageThumbnails = [];
let draggedElement = null;

// Initialize button states
clearBtn.disabled = true;
mergeBtn.disabled = true;
convertBtn.disabled = true;

selectBtn.onclick = async () => {
  const newFiles = await ipcRenderer.invoke("select-pdfs");

  // Add new files to existing selection
  selectedFiles = [...selectedFiles, ...newFiles];

  // Update file list with numbers
  updateFileList();

  // Reset state when new files are selected
  mergedFilePath = null;

  convertBtn.disabled = true;
  clearBtn.disabled = false;
  mergeBtn.disabled = false;
  mergeStatus.textContent = "";
  status.textContent = "";

  // Generate page thumbnails
  await generatePageThumbnails();
};

clearBtn.onclick = () => {
  selectedFiles = [];
  mergedFilePath = null;
  fileList.innerHTML = "";
  pagesContainer.innerHTML = "";
  pageThumbnails = [];

  // Reset button states
  clearBtn.disabled = true;
  mergeBtn.disabled = true;
  convertBtn.disabled = true;

  // Clear status messages
  mergeStatus.textContent = "";
  status.textContent = "";
};

function updateFileList() {
  fileList.innerHTML = "";
  selectedFiles.forEach((file, index) => {
    const li = document.createElement("li");

    // Create file info span
    const fileInfo = document.createElement("span");
    fileInfo.textContent = `${index + 1}. ${file}`;
    fileInfo.className = "file-info";

    // Create remove button
    const removeBtn = document.createElement("button");
    removeBtn.innerHTML = "×";
    removeBtn.className = "remove-file";
    removeBtn.title = "Remover arquivo";
    removeBtn.onclick = () => removeFile(index);

    li.appendChild(fileInfo);
    li.appendChild(removeBtn);
    fileList.appendChild(li);
  });
}

function removeFile(index) {
  // Remove the file from the array
  selectedFiles.splice(index, 1);

  // Update the file list display
  updateFileList();

  // Regenerate thumbnails with updated file indices
  regenerateThumbnailsAfterRemoval();

  // Update button states
  if (selectedFiles.length === 0) {
    clearBtn.disabled = true;
    mergeBtn.disabled = true;
    convertBtn.disabled = true;
  }
}

async function regenerateThumbnailsAfterRemoval() {
  pagesContainer.innerHTML = "";
  pageThumbnails = [];

  for (let i = 0; i < selectedFiles.length; i++) {
    const file = selectedFiles[i];
    try {
      const thumbnails = await ipcRenderer.invoke("generate-thumbnails", file);

      thumbnails.forEach((thumbnail, pageIndex) => {
        const thumbnailDiv = document.createElement("div");
        thumbnailDiv.className = "page-thumbnail";
        thumbnailDiv.draggable = true;
        thumbnailDiv.dataset.fileIndex = i;
        thumbnailDiv.dataset.pageIndex = pageIndex;
        thumbnailDiv.dataset.filePath = file;

        const img = document.createElement("img");
        img.src = thumbnail;
        img.alt = `Page ${pageIndex + 1}`;

        const pageNumber = document.createElement("div");
        pageNumber.className = "page-number";
        pageNumber.textContent = `Arquivo ${i + 1}, Página ${pageIndex + 1}`;

        thumbnailDiv.appendChild(img);
        thumbnailDiv.appendChild(pageNumber);

        // Add drag and drop event listeners
        thumbnailDiv.addEventListener("dragstart", handleDragStart);
        thumbnailDiv.addEventListener("dragend", handleDragEnd);
        thumbnailDiv.addEventListener("dragover", handleDragOver);
        thumbnailDiv.addEventListener("drop", handleDrop);

        pagesContainer.appendChild(thumbnailDiv);
        pageThumbnails.push({
          element: thumbnailDiv,
          filePath: file,
          pageIndex: pageIndex,
          fileIndex: i,
        });
      });
    } catch (err) {
      console.error(`Error generating thumbnails for ${file}:`, err);
    }
  }
}

mergeBtn.onclick = async () => {
  if (selectedFiles.length === 0)
    return alert("Por favor, selecione PDFs primeiro!");
  mergeStatus.textContent = "Juntando PDFs...";
  mergeStatus.className = "status";

  try {
    // Use the current page order from thumbnails
    const orderedPages = getOrderedPagesFromThumbnails();
    mergedFilePath = await ipcRenderer.invoke("merge-pdfs", orderedPages);
    mergeStatus.textContent = `PDF juntado salvo em: ${mergedFilePath}`;
    mergeStatus.className = "status success";
    convertBtn.disabled = false;
  } catch (err) {
    if (err.message === "Operação cancelada pelo usuário") {
      mergeStatus.textContent = "Operação cancelada";
      mergeStatus.className = "status";
    } else {
      mergeStatus.textContent = `Erro: ${err}`;
      mergeStatus.className = "status error";
    }
    convertBtn.disabled = true;
  }
};

convertSingleBtn.onclick = async () => {
  const selectedFile = await ipcRenderer.invoke("select-single-pdf");

  if (selectedFile) {
    status.textContent = "Convertendo para PDF/A...";
    status.className = "status";

    try {
      const conversionResult = await ipcRenderer.invoke(
        "convert-to-pdfa",
        selectedFile
      );
      status.textContent = conversionResult;
      status.className = "status success";
    } catch (err) {
      if (err.message === "Operação cancelada pelo usuário") {
        status.textContent = "Operação cancelada";
        status.className = "status";
      } else {
        status.textContent = `Erro: ${err}`;
        status.className = "status error";
      }
    }
  }
};

convertBtn.onclick = async () => {
  if (!mergedFilePath) return alert("Por favor, junte PDFs primeiro!");
  status.textContent = "Convertendo para PDF/A...";
  status.className = "status";

  try {
    const result = await ipcRenderer.invoke("convert-to-pdfa", mergedFilePath);
    status.textContent = result;
    status.className = "status success";
  } catch (err) {
    if (err.message === "Operação cancelada pelo usuário") {
      status.textContent = "Operação cancelada";
      status.className = "status";
    } else {
      status.textContent = `Erro: ${err}`;
      status.className = "status error";
    }
  }
};

async function generatePageThumbnails() {
  pagesContainer.innerHTML = "";
  pageThumbnails = [];

  for (let i = 0; i < selectedFiles.length; i++) {
    const file = selectedFiles[i];
    try {
      const thumbnails = await ipcRenderer.invoke("generate-thumbnails", file);

      thumbnails.forEach((thumbnail, pageIndex) => {
        const thumbnailDiv = document.createElement("div");
        thumbnailDiv.className = "page-thumbnail";
        thumbnailDiv.draggable = true;
        thumbnailDiv.dataset.fileIndex = i;
        thumbnailDiv.dataset.pageIndex = pageIndex;
        thumbnailDiv.dataset.filePath = file;

        const img = document.createElement("img");
        img.src = thumbnail;
        img.alt = `Page ${pageIndex + 1}`;

        const pageNumber = document.createElement("div");
        pageNumber.className = "page-number";
        pageNumber.textContent = `Arquivo ${i + 1}, Página ${pageIndex + 1}`;

        thumbnailDiv.appendChild(img);
        thumbnailDiv.appendChild(pageNumber);

        // Add drag and drop event listeners
        thumbnailDiv.addEventListener("dragstart", handleDragStart);
        thumbnailDiv.addEventListener("dragend", handleDragEnd);
        thumbnailDiv.addEventListener("dragover", handleDragOver);
        thumbnailDiv.addEventListener("drop", handleDrop);

        pagesContainer.appendChild(thumbnailDiv);
        pageThumbnails.push({
          element: thumbnailDiv,
          filePath: file,
          pageIndex: pageIndex,
          fileIndex: i,
        });
      });
    } catch (err) {
      console.error(`Error generating thumbnails for ${file}:`, err);
    }
  }
}

function handleDragStart(e) {
  draggedElement = this;
  this.classList.add("dragging");
  e.dataTransfer.effectAllowed = "move";
}

function handleDragEnd(e) {
  this.classList.remove("dragging");
  draggedElement = null;
}

function handleDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = "move";
}

function handleDrop(e) {
  e.preventDefault();

  if (draggedElement === this) return;

  const allThumbnails = [...pagesContainer.querySelectorAll(".page-thumbnail")];
  const draggedIndex = allThumbnails.indexOf(draggedElement);
  const droppedIndex = allThumbnails.indexOf(this);

  if (draggedIndex < droppedIndex) {
    this.parentNode.insertBefore(draggedElement, this.nextSibling);
  } else {
    this.parentNode.insertBefore(draggedElement, this);
  }

  // Update pageThumbnails array to reflect new order
  updateThumbnailsOrder();
}

function updateThumbnailsOrder() {
  const newThumbnails = [];
  const allThumbnails = pagesContainer.querySelectorAll(".page-thumbnail");

  allThumbnails.forEach((thumbnail) => {
    const fileIndex = parseInt(thumbnail.dataset.fileIndex);
    const pageIndex = parseInt(thumbnail.dataset.pageIndex);
    const filePath = thumbnail.dataset.filePath;

    newThumbnails.push({
      element: thumbnail,
      filePath: filePath,
      pageIndex: pageIndex,
      fileIndex: fileIndex,
    });
  });

  pageThumbnails = newThumbnails;
}

function getOrderedPagesFromThumbnails() {
  // Return array of page objects in the current visual order
  const orderedPages = [];
  const allThumbnails = pagesContainer.querySelectorAll(".page-thumbnail");

  allThumbnails.forEach((thumbnail) => {
    const fileIndex = parseInt(thumbnail.dataset.fileIndex);
    const pageIndex = parseInt(thumbnail.dataset.pageIndex);
    const filePath = thumbnail.dataset.filePath;

    orderedPages.push({
      filePath: filePath,
      pageIndex: pageIndex,
      fileIndex: fileIndex,
    });
  });

  return orderedPages;
}
