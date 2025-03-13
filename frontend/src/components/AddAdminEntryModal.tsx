import { Modal, TextInput, Button, Label, Select } from "flowbite-react";
import { SubmitHandler, useForm } from "react-hook-form";

interface AddEntryModalProps {
    selectedConfig: string | null;
    isOpen: boolean;
    onClose: () => void;
    onSubmit: SubmitHandler<any>;
    initialData?: any;
}

const AddAdminEntryModal: React.FC<AddEntryModalProps> = ({ selectedConfig, isOpen, onClose, onSubmit }) => {
    const { register, handleSubmit, reset } = useForm<any>({
        defaultValues: {
            role: 'dashboard' // Set default role to 'dashboard'
        }
    });

    const handleFormSubmit: SubmitHandler<any> = (formData) => {
        onSubmit(formData);
        reset({
            name: '',
            email: '',
            role: 'dashboard' // Reset to default after submission
        });
    };

    return (
        <Modal show={isOpen} onClose={onClose}>
            <Modal.Header>Add New User</Modal.Header>
            <Modal.Body>
                <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
                    {selectedConfig === "User" && (
                        <>
                            <Label htmlFor="user-name">Name</Label>
                            <TextInput id="user-name" {...register("name")} required />

                            <Label htmlFor="user-email">Email</Label>
                            <TextInput id="user-email" {...register("email")} required />

                            <Label htmlFor="user-role">Access Level</Label>
                            <Select id="user-role" {...register("role")}>
                                <option value="dashboard">Dashboard Access Only</option>
                                <option value="admin">Admin (Full Access)</option>
                            </Select>
                        </>
                    )}
                    <Button type="submit" color="blue">
                        Save
                    </Button>
                </form>
            </Modal.Body>
        </Modal>
    );
};

export default AddAdminEntryModal;
