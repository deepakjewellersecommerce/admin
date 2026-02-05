/**
 * Price Components Management Page
 * Manage modular pricing components with formula builder
 */

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Plus,
  Edit,
  Trash2,
  Calculator,
  Lock,
  AlertCircle,
  GripVertical,
} from "lucide-react";
import {
  useGetAllComponents,
  useGetCalculationTypes,
  useCreateComponent,
  useUpdateComponent,
  useDeleteComponent,
} from "@/lib/react-query/price-component-query";
import { PriceComponent } from "@/lib/axios/price-component-API";

const PriceComponentsPage = () => {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editItem, setEditItem] = useState<PriceComponent | null>(null);
  const [deleteItem, setDeleteItem] = useState<PriceComponent | null>(null);

  // Form state
  const [formData, setFormData] = useState<Record<string, any>>({});

  // Queries
  const { data: componentsData, isLoading: isLoadingComponents } = useGetAllComponents({
    includeInactive: true,
  });
  const { data: calculationTypesData } = useGetCalculationTypes();

  // Mutations
  const { mutate: createComponent, isPending: isCreating } = useCreateComponent();
  const { mutate: updateComponent, isPending: isUpdating } = useUpdateComponent();
  const { mutate: deleteComponent, isPending: isDeleting } = useDeleteComponent();

  const components: PriceComponent[] = componentsData?.components || [];
  // calculationTypes comes from API response -> response.data -> { types }
  const calculationTypes = calculationTypesData?.data?.types || [];

  const resetForm = () => {
    setFormData({});
    setEditItem(null);
    setShowAddDialog(false);
  };

  const handleAdd = () => {
    setEditItem(null);
    setFormData({
      calculationType: "FIXED",
      defaultValue: 0,
      isActive: true,
      isVisible: true,
      allowsFreeze: true,
    });
    setShowAddDialog(true);
  };

  const handleEdit = (component: PriceComponent) => {
    setEditItem(component);
    setFormData({ ...component });
    setShowAddDialog(true);
  };

  const handleDelete = (component: PriceComponent) => {
    setDeleteItem(component);
    setShowDeleteDialog(true);
  };

  const handleSubmit = () => {
    if (editItem) {
      updateComponent(
        { id: editItem._id, data: formData },
        { onSuccess: resetForm }
      );
    } else {
      createComponent(formData, { onSuccess: resetForm });
    }
  };

  const handleConfirmDelete = (force: boolean) => {
    if (!deleteItem) return;
    deleteComponent(
      { id: deleteItem._id, force },
      {
        onSuccess: () => {
          setDeleteItem(null);
          setShowDeleteDialog(false);
        },
      }
    );
  };

  const getCalculationTypeDescription = (type: string) => {
    const descriptions: Record<string, string> = {
      PER_GRAM: "netWeight × value",
      PERCENTAGE: "base × (value / 100), where base is metalCost or subtotal",
      FIXED: "Fixed amount in rupees",
    };
    return descriptions[type] || type;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Price Components</h1>
          <p className="text-muted-foreground">
            Define modular pricing components used in price calculations
          </p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="h-4 w-4 mr-2" />
          Add Component
        </Button>
      </div>

      {/* Components Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Components</CardTitle>
          <CardDescription>
            System components are marked with a lock icon and have restrictions on editing
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingComponents ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12" />
              ))}
            </div>
          ) : components.length === 0 ? (
            <div className="text-center py-12">
              <Calculator className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                No components defined yet. Click 'Add Component' to create one.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10"></TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Key</TableHead>
                  <TableHead>Calculation Type</TableHead>
                  <TableHead>Default Value</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {components.map((component) => (
                  <TableRow key={component._id}>
                    <TableCell>
                      <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {component.isSystemComponent && (
                          <Lock className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span className="font-medium">{component.name}</span>
                      </div>
                      {component.description && (
                        <p className="text-xs text-muted-foreground">
                          {component.description}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      <code className="text-sm bg-muted px-1 rounded">
                        {component.key}
                      </code>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{component.calculationType}</Badge>
                      {component.calculationType === "PERCENTAGE" && component.percentageOf && (
                        <span className="text-xs text-muted-foreground ml-2">
                          of {component.percentageOf}
                        </span>
                      )}
                      {component.key === "metal_cost" && component.metalPriceMode && (
                        <Badge variant="secondary" className="ml-2 text-xs">
                          {component.metalPriceMode}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {component.calculationType === "PERCENTAGE"
                        ? `${component.defaultValue}%`
                        : component.calculationType === "FIXED"
                        ? `₹${component.defaultValue}`
                        : component.defaultValue}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <Badge variant={component.isActive ? "default" : "secondary"}>
                          {component.isActive ? "Active" : "Inactive"}
                        </Badge>
                        {component.allowsFreeze && (
                          <Badge variant="outline" className="text-xs">
                            Freezable
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(component)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {!component.isSystemComponent && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(component)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editItem ? "Edit Component" : "Add Component"}
            </DialogTitle>
            <DialogDescription>
              {editItem?.isSystemComponent
                ? "System components have limited editing capabilities"
                : "Define a new pricing component"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-auto">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name || ""}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Making Charges"
                  disabled={editItem?.isSystemComponent}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="key">Key *</Label>
                <Input
                  id="key"
                  value={formData.key || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, key: e.target.value.toLowerCase() })
                  }
                  placeholder="e.g., making_charges"
                  disabled={!!editItem}
                />
                <p className="text-xs text-muted-foreground">
                  Unique identifier (cannot be changed)
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description || ""}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Optional description"
                disabled={editItem?.isSystemComponent}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="calculationType">Calculation Type *</Label>
                <Select
                  value={formData.calculationType || "FIXED"}
                  onValueChange={(value) =>
                    setFormData({ ...formData, calculationType: value })
                  }
                  disabled={editItem?.isSystemComponent}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {calculationTypes.map((type: any) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.key}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {getCalculationTypeDescription(formData.calculationType)}
                </p>
              </div>

              {formData.calculationType !== "FORMULA" && (
                <div className="space-y-2">
                  <Label htmlFor="defaultValue">Default Value *</Label>
                  <Input
                    id="defaultValue"
                    type="number"
                    value={formData.defaultValue || 0}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        defaultValue: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>
              )}
            </div>

            {formData.calculationType === "PERCENTAGE" && (
              <div className="space-y-2">
                <Label htmlFor="percentageOf">Percentage Of</Label>
                <Select
                  value={formData.percentageOf || "metalCost"}
                  onValueChange={(value) =>
                    setFormData({ ...formData, percentageOf: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="metalCost">Metal Cost</SelectItem>
                    <SelectItem value="subtotal">Subtotal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {formData.key === "metal_cost" && (
              <div className="space-y-2">
                <Label htmlFor="metalPriceMode">Metal Price Mode</Label>
                <Select
                  value={formData.metalPriceMode || "AUTO"}
                  onValueChange={(value) =>
                    setFormData({ ...formData, metalPriceMode: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AUTO">AUTO (System Rate)</SelectItem>
                    <SelectItem value="MANUAL">MANUAL (Admin Override)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  AUTO uses live system metal rate, MANUAL allows admin to set a custom price
                </p>
              </div>
            )}

            <div className="grid grid-cols-3 gap-4 pt-4 border-t">
              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive !== false}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isActive: checked })
                  }
                />
                <Label htmlFor="isActive">Active</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="isVisible"
                  checked={formData.isVisible !== false}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isVisible: checked })
                  }
                />
                <Label htmlFor="isVisible">Visible in Breakdown</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="allowsFreeze"
                  checked={formData.allowsFreeze !== false}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, allowsFreeze: checked })
                  }
                  disabled={editItem?.isSystemComponent}
                />
                <Label htmlFor="allowsFreeze">Can Be Frozen</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetForm}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isCreating || isUpdating}
            >
              {isCreating || isUpdating
                ? "Saving..."
                : editItem
                ? "Update"
                : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Component</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deleteItem?.name}"?
            </DialogDescription>
          </DialogHeader>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Warning</AlertTitle>
            <AlertDescription>
              Deleting a component may affect existing pricing configurations.
              Consider deactivating instead.
            </AlertDescription>
          </Alert>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleConfirmDelete(false)}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleConfirmDelete(true)}
              disabled={isDeleting}
            >
              Force Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Info */}
      <Alert className="bg-blue-50 border-blue-100">
        <AlertCircle className="h-4 w-4 text-blue-700" />
        <AlertTitle className="text-blue-700">Calculation Types</AlertTitle>
        <AlertDescription className="text-blue-600">
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>
              <strong>PER_GRAM:</strong> Multiplies by net weight (netWeight × value)
            </li>
            <li>
              <strong>PERCENTAGE:</strong> Calculates as percentage of metalCost or subtotal
            </li>
            <li>
              <strong>FIXED:</strong> Fixed rupee amount
            </li>
          </ul>
          <p className="mt-2">
            <strong>Metal Cost Component:</strong> Can be set to AUTO (uses system rate) or MANUAL (admin enters price per gram)
          </p>
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default PriceComponentsPage;
