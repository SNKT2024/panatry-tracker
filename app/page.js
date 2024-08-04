"use client";
import { useState, useEffect } from "react";
import { firestore } from "@/firebase";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
} from "firebase/firestore";
import {
  Box,
  Button,
  FormControl,
  FormHelperText,
  List,
  ListItem,
  MenuItem,
  Modal,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

export default function Home() {
  const [inventory, setInventory] = useState([]);
  const [open, setOpen] = useState(false);
  const [itemName, setItemName] = useState("");
  const [category, setCategory] = useState("");
  const [search, setSearch] = useState("");
  const [recipe, setRecipe] = useState([]);

  const updateInventory = async () => {
    const inventoryRef = collection(firestore, "inventory");
    const categorySnapshot = await getDocs(inventoryRef);
    const inventoryList = [];

    for (const categoryDoc of categorySnapshot.docs) {
      const category = categoryDoc.id;
      const itemsRef = collection(inventoryRef, category, "items");
      const itemsSnapshot = await getDocs(itemsRef);

      itemsSnapshot.forEach((itemDoc) => {
        inventoryList.push({
          category: category,
          name: itemDoc.id,
          ...itemDoc.data(),
        });
      });
    }

    setInventory(inventoryList);
  };

  const removeItem = async (item, category) => {
    const categoryRef = doc(collection(firestore, "inventory"), category);
    const itemRef = doc(collection(categoryRef, "items"), item);

    const docSnap = await getDoc(itemRef);

    if (docSnap.exists()) {
      const { quantity } = docSnap.data();
      if (quantity === 1) {
        await deleteDoc(itemRef);
      } else {
        await setDoc(itemRef, { quantity: quantity - 1 }, { merge: true });
      }
    }
    await updateInventory();
  };

  const addItem = async (item, category) => {
    const categoryRef = doc(collection(firestore, "inventory"), category);
    const itemRef = doc(collection(categoryRef, "items"), item);
    const docSnap = await getDoc(itemRef);

    if (docSnap.exists()) {
      const { quantity } = docSnap.data();
      await setDoc(itemRef, { quantity: quantity + 1 }, { merge: true });
    } else {
      await setDoc(itemRef, { quantity: 1 });
    }

    await updateInventory();
  };

  const createPrompt = (ingredients) => {
    const ingredientList = ingredients.map((item) => item.name).join(", ");
    return `Generate a recipe using the following ingredients: ${ingredientList}.`;
  };

  const fetchRecipe = async (ingredients) => {
    const prompt = createPrompt(ingredients);

    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer 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`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "meta-llama/llama-3.1-8b-instruct:free",
        messages: [{ role: "user", content: prompt }],
      }),
    });
    const data = await res.json();
    return data.choices[0].message.content;
  };

  const generateRecipe = async () => {
    const recipeText = await fetchRecipe(inventory);
    const parsedRecipe = recipeText
      .split("\n")
      .filter((line) => line.trim() !== "")
      .map((line) =>
        line.startsWith("*")
          ? { text: line.slice(1).trim(), bold: true }
          : { text: line.trim(), bold: false }
      );
    setRecipe(parsedRecipe);
  };

  const formatText = (text) => {
    // Replace ** with <strong>
    let formattedText = text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    // Replace * with <strong>
    formattedText = formattedText.replace(/\*(.*?)\*/g, "<strong>$1</strong>");
    return formattedText;
  };

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  useEffect(() => {
    updateInventory();
  }, []);

  const filteredInventory = inventory.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Box
      width="100vw"
      height="100vh"
      display="flex"
      flexDirection={"column"}
      justifyContent="center"
      alignItems="center"
      gap={2}
    >
      <Modal open={open} onClose={handleClose}>
        <Box
          position={"absolute"}
          top={"50%"}
          left={"50%"}
          width={800}
          bgcolor={"white"}
          border={"2px solid #000"}
          boxShadow={24}
          p={4}
          display={"flex"}
          flexDirection={"column"}
          gap={3}
          sx={{
            transform: "translate(-50%,-50%)",
          }}
        >
          <FormControl fullWidth>
            <Typography variant="h6">Add Item</Typography>
            <Stack width={"100%"} direction={"row"} spacing={2}>
              <TextField
                variant="outlined"
                fullWidth
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                sx={{ width: "70%" }}
              />
              <Select
                sx={{ width: "30%" }}
                color="primary"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <MenuItem value="Fruit">Fruit</MenuItem>
                <MenuItem value="Vegetable">Vegetable</MenuItem>
                <MenuItem value="Dairy">Dairy</MenuItem>
                <MenuItem value="Snack">Snack</MenuItem>
                <MenuItem value="Sauces">Sauces</MenuItem>
              </Select>

              <Button
                variant="outlined"
                onClick={() => {
                  addItem(itemName, category);
                  setItemName("");
                  setCategory("");
                  handleClose();
                }}
              >
                Add
              </Button>
            </Stack>
          </FormControl>
        </Box>
      </Modal>
      <Typography variant="h2">Panatry Tracker</Typography>
      <Button
        variant="contained"
        onClick={() => {
          handleOpen();
        }}
      >
        Add Item
      </Button>
      <TextField
        label="Search"
        variant="outlined"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <Box border={"1px solid black"}>
        <Box
          width={"800px"}
          height={"100px"}
          bgcolor={"#ADD8E6"}
          display={"flex"}
          flexDirection={"column"}
          alignItems={"center"}
          justifyContent={"center"}
        >
          <Typography variant="h3">Items</Typography>
        </Box>
        <Stack
          width={"800px"}
          height={"300px"}
          spacing={2}
          sx={{ overflowY: "auto" }}
        >
          {filteredInventory.map(({ name, quantity, category }) => (
            <Box
              key={`${category}-${name}`}
              width={"100%"}
              minHeight={"150px"}
              display={"flex"}
              alignItems={"center"}
              justifyContent={"space-between"}
              bgcolor={"#f0f0f0"}
              padding={5}
            >
              <Typography variant="h3" color={"#333"} textAlign={"center"}>
                {name.charAt(0).toUpperCase() + name.slice(1)}
              </Typography>
              <FormHelperText variant="h3" color={"#666"} textAlign={"center"}>
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </FormHelperText>
              <Typography variant="h3" color={"#333"} textAlign={"center"}>
                {quantity}
              </Typography>
              <Stack direction={"row"} spacing={2}>
                <Button
                  variant="contained"
                  onClick={() => addItem(name, category)}
                >
                  Add
                </Button>
                <Button
                  variant="contained"
                  onClick={() => removeItem(name, category)}
                >
                  Remove
                </Button>
              </Stack>
            </Box>
          ))}
        </Stack>
      </Box>
      <Box border={"1px solid black"}>
        <Button variant="contained" onClick={generateRecipe}>
          Generate Recipe
        </Button>
      </Box>

      <Box mt={4} border={"1px solid black"} padding={2}>
        <Typography variant="h4">Generated Recipe</Typography>
        <List>
          {recipe.map((line, index) => (
            <ListItem key={index}>
              <Typography
                variant="body1"
                sx={line.bold ? { fontWeight: "bold" } : {}}
                dangerouslySetInnerHTML={{ __html: formatText(line.text) }}
              />
            </ListItem>
          ))}
        </List>
      </Box>
    </Box>
  );
}
